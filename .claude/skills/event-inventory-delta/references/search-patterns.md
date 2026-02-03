# Search Patterns (Quick Reference)

Use these patterns with ripgrep (rg) or your IDE search.

## NATS / JetStream publishers

- `publish(`, `emit(`, `send(`
- `nc.publish(`, `js.publish(`, `jetstream.publish(`

Suggested rg:
- `rg -n "\\b(publish|emit|send)\\s*\\(\\s*['\"]" services`  
- `rg -n "nc\\.publish\\s*\\(\\s*['\"]" services`  
- `rg -n "js\\.publish\\s*\\(\\s*['\"]" services`

## NATS / JetStream consumers

- `subscribe(`, `js.subscribe(`
- NestJS: `@EventPattern(`, `@MessagePattern(`

Suggested rg:
- `rg -n "\\bsubscribe\\s*\\(\\s*['\"]" services`  
- `rg -n "@(?:EventPattern|MessagePattern)\\(\\s*['\"]" services`

## NestJS HTTP routes

- `@Get(`, `@Post(`, `@Put(`, `@Patch(`, `@Delete(`

Suggested rg:
- `rg -n "@(?:Get|Post|Put|Patch|Delete)\\(" services`

## Express / Fastify

- `app.get(`, `app.post(`, `router.get(`, `router.post(`

Suggested rg:
- `rg -n "\\b(app|router)\\.(get|post|put|patch|delete)\\(" services`

## FastAPI

- `@app.get(`, `@app.post(`

Suggested rg:
- `rg -n "@app\\.(get|post|put|patch|delete)\\(" services`

## gRPC proto

- `service <Name> {` and `rpc <Method>(` in `.proto`

Suggested rg:
- `rg -n "^\\s*service\\s+\\w+" contracts proto`  
- `rg -n "^\\s*rpc\\s+\\w+\\s*\\(" contracts proto`
