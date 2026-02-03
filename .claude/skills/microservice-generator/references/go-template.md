# Go Service Template (gRPC)

## Structure

```
services/<service-name>/
├── cmd/
│   └── server/
│       └── main.go
├── internal/
│   ├── config/
│   │   └── config.go
│   ├── domain/
│   │   ├── <aggregate>.go
│   │   ├── events.go
│   │   └── repository.go
│   ├── application/
│   │   ├── commands/
│   │   │   └── <command>_handler.go
│   │   └── queries/
│   │       └── <query>_handler.go
│   ├── infrastructure/
│   │   ├── grpc/
│   │   │   └── server.go
│   │   ├── persistence/
│   │   │   └── postgres_repository.go
│   │   ├── consul/
│   │   │   └── client.go
│   │   └── nats/
│   │       └── publisher.go
│   └── pkg/
│       └── errors/
│           └── domain_errors.go
├── proto/
│   └── generated/
├── migrations/
│   └── 001_init.up.sql
├── Dockerfile
├── go.mod
├── go.sum
└── Makefile
```

---

## Fichiers clés

### cmd/server/main.go

```go
package main

import (
	"context"
	"log"
	"net"
	"os"
	"os/signal"
	"syscall"

	"google.golang.org/grpc"
	"google.golang.org/grpc/health"
	"google.golang.org/grpc/health/grpc_health_v1"

	"<module>/internal/config"
	"<module>/internal/infrastructure/consul"
	"<module>/internal/infrastructure/grpc/server"
	"<module>/internal/infrastructure/persistence"
)

func main() {
	cfg := config.Load()

	// Database
	db, err := persistence.NewPostgresConnection(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	// gRPC Server
	lis, err := net.Listen("tcp", ":"+cfg.GRPCPort)
	if err != nil {
		log.Fatalf("Failed to listen: %v", err)
	}

	grpcServer := grpc.NewServer()

	// Register services
	server.RegisterServices(grpcServer, db)

	// Health check
	healthServer := health.NewServer()
	grpc_health_v1.RegisterHealthServer(grpcServer, healthServer)
	healthServer.SetServingStatus("", grpc_health_v1.HealthCheckResponse_SERVING)

	// Consul registration
	consulClient, err := consul.NewClient(cfg.ConsulHost, cfg.ConsulPort)
	if err != nil {
		log.Fatalf("Failed to connect to Consul: %v", err)
	}

	serviceID := cfg.ServiceName + "-" + cfg.Hostname
	if err := consulClient.Register(serviceID, cfg.ServiceName, cfg.GRPCPort); err != nil {
		log.Fatalf("Failed to register with Consul: %v", err)
	}

	// Graceful shutdown
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	go func() {
		log.Printf("Starting gRPC server on :%s", cfg.GRPCPort)
		if err := grpcServer.Serve(lis); err != nil {
			log.Fatalf("Failed to serve: %v", err)
		}
	}()

	<-ctx.Done()
	log.Println("Shutting down...")

	consulClient.Deregister(serviceID)
	grpcServer.GracefulStop()
}
```

### internal/config/config.go

```go
package config

import (
	"os"
)

type Config struct {
	ServiceName    string
	BoundedContext string
	Hostname       string
	GRPCPort       string
	DatabaseURL    string
	NatsURL        string
	ConsulHost     string
	ConsulPort     string
}

func Load() *Config {
	return &Config{
		ServiceName:    getEnv("SERVICE_NAME", "<service-name>"),
		BoundedContext: getEnv("BOUNDED_CONTEXT", "<context>"),
		Hostname:       getEnv("HOSTNAME", "localhost"),
		GRPCPort:       getEnv("GRPC_PORT", "50061"),
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/<context>_db?sslmode=disable"),
		NatsURL:        getEnv("NATS_URL", "nats://localhost:4222"),
		ConsulHost:     getEnv("CONSUL_HOST", "localhost"),
		ConsulPort:     getEnv("CONSUL_PORT", "8500"),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
```

### internal/domain/<aggregate>.go

```go
package domain

import (
	"errors"
	"time"

	"github.com/google/uuid"
)

// Aggregate Root
type <Aggregate> struct {
	id        string
	userID    string
	name      string
	status    <Aggregate>Status
	createdAt time.Time
	updatedAt time.Time

	// Domain events
	events []DomainEvent
}

type <Aggregate>Status string

const (
	StatusDraft    <Aggregate>Status = "draft"
	StatusActive   <Aggregate>Status = "active"
	StatusArchived <Aggregate>Status = "archived"
)

// Factory
func New<Aggregate>(userID, name string) (*<Aggregate>, error) {
	if userID == "" {
		return nil, errors.New("user_id is required")
	}
	if name == "" {
		return nil, errors.New("name is required")
	}

	now := time.Now()
	agg := &<Aggregate>{
		id:        uuid.New().String(),
		userID:    userID,
		name:      name,
		status:    StatusDraft,
		createdAt: now,
		updatedAt: now,
		events:    make([]DomainEvent, 0),
	}

	agg.addEvent(<Aggregate>CreatedEvent{
		AggregateID: agg.id,
		UserID:      userID,
		Name:        name,
		CreatedAt:   now,
	})

	return agg, nil
}

// Business methods
func (a *<Aggregate>) Activate() error {
	if a.status != StatusDraft {
		return errors.New("can only activate draft <aggregate>")
	}

	a.status = StatusActive
	a.updatedAt = time.Now()

	a.addEvent(<Aggregate>ActivatedEvent{
		AggregateID: a.id,
		ActivatedAt: a.updatedAt,
	})

	return nil
}

func (a *<Aggregate>) Archive() error {
	if a.status == StatusArchived {
		return errors.New("<aggregate> already archived")
	}

	a.status = StatusArchived
	a.updatedAt = time.Now()

	return nil
}

// Getters
func (a *<Aggregate>) ID() string              { return a.id }
func (a *<Aggregate>) UserID() string          { return a.userID }
func (a *<Aggregate>) Name() string            { return a.name }
func (a *<Aggregate>) Status() <Aggregate>Status { return a.status }

// Events
func (a *<Aggregate>) addEvent(event DomainEvent) {
	a.events = append(a.events, event)
}

func (a *<Aggregate>) GetUncommittedEvents() []DomainEvent {
	return a.events
}

func (a *<Aggregate>) ClearEvents() {
	a.events = make([]DomainEvent, 0)
}
```

### internal/domain/events.go

```go
package domain

import "time"

type DomainEvent interface {
	EventType() string
}

type <Aggregate>CreatedEvent struct {
	AggregateID string
	UserID      string
	Name        string
	CreatedAt   time.Time
}

func (e <Aggregate>CreatedEvent) EventType() string {
	return "<context>.<aggregate>.created"
}

type <Aggregate>ActivatedEvent struct {
	AggregateID string
	ActivatedAt time.Time
}

func (e <Aggregate>ActivatedEvent) EventType() string {
	return "<context>.<aggregate>.activated"
}
```

### internal/domain/repository.go

```go
package domain

import "context"

type <Aggregate>Repository interface {
	Save(ctx context.Context, agg *<Aggregate>) error
	FindByID(ctx context.Context, id string) (*<Aggregate>, error)
	FindByUserID(ctx context.Context, userID string, page, pageSize int) ([]*<Aggregate>, int, error)
	Delete(ctx context.Context, id string) error
}
```

### internal/infrastructure/grpc/server.go

```go
package server

import (
	"context"
	"database/sql"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	pb "<module>/proto/generated/<context>"
	"<module>/internal/domain"
	"<module>/internal/infrastructure/persistence"
)

type <Context>Server struct {
	pb.Unimplemented<Context>CommandsServiceServer
	pb.Unimplemented<Context>QueriesServiceServer
	repo domain.<Aggregate>Repository
}

func RegisterServices(s *grpc.Server, db *sql.DB) {
	repo := persistence.NewPostgres<Aggregate>Repository(db)
	server := &<Context>Server{repo: repo}

	pb.Register<Context>CommandsServiceServer(s, server)
	pb.Register<Context>QueriesServiceServer(s, server)
}

// Commands

func (s *<Context>Server) Create<Aggregate>(ctx context.Context, req *pb.Create<Aggregate>Request) (*pb.Create<Aggregate>Response, error) {
	agg, err := domain.New<Aggregate>(req.UserId, req.Name)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}

	if err := s.repo.Save(ctx, agg); err != nil {
		return nil, status.Error(codes.Internal, "failed to save")
	}

	return &pb.Create<Aggregate>Response{
		Id:      agg.ID(),
		Success: true,
	}, nil
}

// Queries

func (s *<Context>Server) Get<Aggregate>(ctx context.Context, req *pb.Get<Aggregate>Request) (*pb.Get<Aggregate>Response, error) {
	agg, err := s.repo.FindByID(ctx, req.Id)
	if err != nil {
		return nil, status.Error(codes.NotFound, "not found")
	}

	return &pb.Get<Aggregate>Response{
		<Aggregate>: toDTO(agg),
	}, nil
}

func toDTO(agg *domain.<Aggregate>) *pb.<Aggregate>Dto {
	return &pb.<Aggregate>Dto{
		Id:     agg.ID(),
		UserId: agg.UserID(),
		Name:   agg.Name(),
		Status: string(agg.Status()),
	}
}
```

### internal/infrastructure/consul/client.go

```go
package consul

import (
	"fmt"

	"github.com/hashicorp/consul/api"
)

type Client struct {
	client *api.Client
}

func NewClient(host, port string) (*Client, error) {
	config := api.DefaultConfig()
	config.Address = fmt.Sprintf("%s:%s", host, port)

	client, err := api.NewClient(config)
	if err != nil {
		return nil, err
	}

	return &Client{client: client}, nil
}

func (c *Client) Register(serviceID, serviceName, grpcPort string) error {
	registration := &api.AgentServiceRegistration{
		ID:   serviceID,
		Name: serviceName,
		Port: parseInt(grpcPort),
		Tags: []string{"grpc", "go"},
		Check: &api.AgentServiceCheck{
			GRPC:     fmt.Sprintf("%s:%s", serviceID, grpcPort),
			Interval: "10s",
			Timeout:  "5s",
		},
	}

	return c.client.Agent().ServiceRegister(registration)
}

func (c *Client) Deregister(serviceID string) error {
	return c.client.Agent().ServiceDeregister(serviceID)
}

func parseInt(s string) int {
	var n int
	fmt.Sscanf(s, "%d", &n)
	return n
}
```

---

## go.mod

```go
module <module>

go 1.21

require (
	github.com/google/uuid v1.5.0
	github.com/hashicorp/consul/api v1.27.0
	github.com/lib/pq v1.10.9
	github.com/nats-io/nats.go v1.31.0
	google.golang.org/grpc v1.60.1
	google.golang.org/protobuf v1.32.0
)
```

---

## Dockerfile

```dockerfile
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Dependencies
COPY go.mod go.sum ./
RUN go mod download

# Build
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /server ./cmd/server

# Runtime
FROM alpine:3.19

RUN apk --no-cache add ca-certificates

WORKDIR /app
COPY --from=builder /server .

EXPOSE 50061

CMD ["./server"]
```

---

## Makefile

```makefile
.PHONY: build run test proto

SERVICE_NAME := <service-name>
GRPC_PORT := 50061

build:
	go build -o bin/server ./cmd/server

run:
	go run ./cmd/server

test:
	go test -v ./...

proto:
	buf generate

docker-build:
	docker build -t $(SERVICE_NAME) .

docker-run:
	docker run -p $(GRPC_PORT):$(GRPC_PORT) $(SERVICE_NAME)
```

---

## docker-compose

```yaml
# compose/<service-name>.yml
version: '3.8'

services:
  <service-name>:
    build:
      context: ../services/<service-name>
      dockerfile: Dockerfile
    container_name: <service-name>
    environment:
      - SERVICE_NAME=<service-name>
      - BOUNDED_CONTEXT=<context>
      - GRPC_PORT=50061
      - DATABASE_URL=postgres://postgres:postgres@postgres-<context>:5432/<context>_db?sslmode=disable
      - NATS_URL=nats://nats:4222
      - CONSUL_HOST=consul
      - CONSUL_PORT=8500
    ports:
      - "50061:50061"
    depends_on:
      - postgres-<context>
      - nats
      - consul
    networks:
      - winaity-network
    restart: unless-stopped

  postgres-<context>:
    image: postgres:15-alpine
    container_name: postgres-<context>
    environment:
      - POSTGRES_DB=<context>_db
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    volumes:
      - postgres-<context>-data:/var/lib/postgresql/data
    ports:
      - "5442:5432"
    networks:
      - winaity-network

volumes:
  postgres-<context>-data:

networks:
  winaity-network:
    external: true
```

---

## migrations/001_init.up.sql

```sql
CREATE TABLE IF NOT EXISTS <aggregate>s (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_<aggregate>s_user_id ON <aggregate>s(user_id);
CREATE INDEX idx_<aggregate>s_status ON <aggregate>s(status);
```

---

## Commandes

```bash
# Init
cd services/<service-name>
go mod tidy

# Proto
buf generate

# Build
go build -o bin/server ./cmd/server

# Run
./bin/server

# Test
go test -v ./...

# Docker
docker build -t <service-name> .
docker compose -f compose/<service-name>.yml up -d
```

---

## Notes V1

Ce template est un **squelette minimal**. Pour V2+ :
- Ajouter NATS publisher pour domain events
- Ajouter middleware gRPC (logging, recovery, metrics)
- Ajouter tracing OpenTelemetry
- Ajouter validation avec go-playground/validator
- Ajouter migration tool (golang-migrate)
- Ajouter tests d'intégration avec testcontainers
- Ajouter Makefile complet
