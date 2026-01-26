import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1769426087209 implements MigrationInterface {
    name = 'Init1769426087209'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "statut_facture" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(50) NOT NULL, "nom" character varying(100) NOT NULL, "description" text, "ordre_affichage" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e15bf906a4742b24187dbce83a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_462844dab066674a9e9d478dee" ON "statut_facture" ("code") `);
        await queryRunner.query(`CREATE TABLE "facture" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organisation_id" uuid NOT NULL, "numero" character varying(50), "date_emission" date NOT NULL, "montant_ht" numeric(12,2) NOT NULL DEFAULT '0', "montant_ttc" numeric(12,2) NOT NULL DEFAULT '0', "statut_id" uuid NOT NULL, "emission_facture_id" uuid NOT NULL, "client_base_id" uuid NOT NULL, "contrat_id" uuid, "client_partenaire_id" uuid NOT NULL, "adresse_facturation_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0ad1064da893f894e39f961ca67" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_4d18d42e943aa5c94df472a259" ON "facture" ("organisation_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0870d4cdeff773e00fd7eeef7f" ON "facture" ("contrat_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7e34dfc8132d25de8b1adf2032" ON "facture" ("client_base_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_e0b129c69f0e003ff5ab266d98" ON "facture" ("organisation_id", "date_emission") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_698efa8f3e074d859f2632d473" ON "facture" ("organisation_id", "numero") WHERE numero IS NOT NULL`);
        await queryRunner.query(`CREATE TABLE "ligne_facture" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "facture_id" uuid NOT NULL, "produit_id" uuid NOT NULL, "quantite" integer NOT NULL, "prix_unitaire" numeric(12,2) NOT NULL, "description" text, "montant_ht" numeric(12,2) NOT NULL, "taux_tva" numeric(5,2) NOT NULL DEFAULT '20', "montant_tva" numeric(12,2) NOT NULL, "montant_ttc" numeric(12,2) NOT NULL, "ordre_affichage" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2a4870ac04282ed329d91b2a3bb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ebf242dc10bfa75f54d87863fd" ON "ligne_facture" ("facture_id") `);
        await queryRunner.query(`CREATE TYPE "public"."invoices_status_enum" AS ENUM('DRAFT', 'VALIDATED', 'PAID', 'CANCELLED', 'CREDIT_NOTE')`);
        await queryRunner.query(`CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoice_number" character varying(50) NOT NULL, "status" "public"."invoices_status_enum" NOT NULL DEFAULT 'DRAFT', "customer_name" character varying(255) NOT NULL, "customer_address" text NOT NULL, "customer_siret" character varying(100), "customer_tva_number" character varying(100), "customer_email" character varying(255), "customer_phone" character varying(50), "issue_date" date NOT NULL, "delivery_date" date NOT NULL, "due_date" date NOT NULL, "total_ht" numeric(10,2) NOT NULL DEFAULT '0', "total_tva" numeric(10,2) NOT NULL DEFAULT '0', "total_ttc" numeric(10,2) NOT NULL DEFAULT '0', "payment_terms_days" integer NOT NULL DEFAULT '30', "late_payment_interest_rate" numeric(5,2) NOT NULL DEFAULT '13.5', "recovery_indemnity" numeric(10,2) NOT NULL DEFAULT '40', "vat_mention" text, "notes" text, "pdf_path" character varying(500), "pdf_hash" character varying(64), "original_invoice_id" uuid, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "validated_at" TIMESTAMP, "paid_at" TIMESTAMP, CONSTRAINT "UQ_d8f8d3788694e1b3f96c42c36fb" UNIQUE ("invoice_number"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_5f0dc2b85fac23f0c3870196b1" ON "invoices" ("issue_date") `);
        await queryRunner.query(`CREATE INDEX "IDX_ac0f09364e3701d9ed35435288" ON "invoices" ("status") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d8f8d3788694e1b3f96c42c36f" ON "invoices" ("invoice_number") `);
        await queryRunner.query(`CREATE TABLE "invoice_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoice_id" uuid NOT NULL, "line_number" integer NOT NULL, "description" character varying(500) NOT NULL, "quantity" numeric(10,3) NOT NULL, "unit" character varying(50) NOT NULL DEFAULT 'pièce', "unit_price_ht" numeric(10,2) NOT NULL, "vat_rate" numeric(5,2) NOT NULL, "discount" numeric(10,2) NOT NULL DEFAULT '0', "total_ht" numeric(10,2) NOT NULL, "total_tva" numeric(10,2) NOT NULL, "total_ttc" numeric(10,2) NOT NULL, "invoiceId" uuid, CONSTRAINT "PK_53b99f9e0e2945e69de1a12b75a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "facture_settings" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "societe_id" uuid NOT NULL, "logo_base64" text, "logo_mime_type" character varying(50), "primary_color" character varying(7) NOT NULL DEFAULT '#000000', "secondary_color" character varying(7), "company_name" character varying(200), "company_address" text, "company_phone" character varying(50), "company_email" character varying(100), "company_siret" character varying(20), "company_tva_number" character varying(20), "company_rcs" character varying(100), "company_capital" character varying(50), "iban" character varying(34), "bic" character varying(11), "bank_name" character varying(100), "header_text" text, "footer_text" text, "legal_mentions" text, "payment_terms" text, "invoice_prefix" character varying(20), "show_logo" boolean NOT NULL DEFAULT true, "logo_position" character varying(10) NOT NULL DEFAULT 'left', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_20e8ac166addb478e9654ee052c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_458bb4869cfb3fc49838d05bf4" ON "facture_settings" ("societe_id") `);
        await queryRunner.query(`CREATE TABLE "emission_facture" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(50) NOT NULL, "nom" character varying(100) NOT NULL, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_00e05e8fe8e76aa6148a76e036b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_78ce856cbb7b19ebea0eb62fa6" ON "emission_facture" ("code") `);
        await queryRunner.query(`ALTER TABLE "facture" ADD CONSTRAINT "FK_18b99c4d169597f4cdeb8aecd29" FOREIGN KEY ("statut_id") REFERENCES "statut_facture"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ligne_facture" ADD CONSTRAINT "FK_ebf242dc10bfa75f54d87863fd6" FOREIGN KEY ("facture_id") REFERENCES "facture"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice_items" ADD CONSTRAINT "FK_7fb6895fc8fad9f5200e91abb59" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "invoice_items" DROP CONSTRAINT "FK_7fb6895fc8fad9f5200e91abb59"`);
        await queryRunner.query(`ALTER TABLE "ligne_facture" DROP CONSTRAINT "FK_ebf242dc10bfa75f54d87863fd6"`);
        await queryRunner.query(`ALTER TABLE "facture" DROP CONSTRAINT "FK_18b99c4d169597f4cdeb8aecd29"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_78ce856cbb7b19ebea0eb62fa6"`);
        await queryRunner.query(`DROP TABLE "emission_facture"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_458bb4869cfb3fc49838d05bf4"`);
        await queryRunner.query(`DROP TABLE "facture_settings"`);
        await queryRunner.query(`DROP TABLE "invoice_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d8f8d3788694e1b3f96c42c36f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ac0f09364e3701d9ed35435288"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5f0dc2b85fac23f0c3870196b1"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP TYPE "public"."invoices_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ebf242dc10bfa75f54d87863fd"`);
        await queryRunner.query(`DROP TABLE "ligne_facture"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_698efa8f3e074d859f2632d473"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e0b129c69f0e003ff5ab266d98"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7e34dfc8132d25de8b1adf2032"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0870d4cdeff773e00fd7eeef7f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4d18d42e943aa5c94df472a259"`);
        await queryRunner.query(`DROP TABLE "facture"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_462844dab066674a9e9d478dee"`);
        await queryRunner.query(`DROP TABLE "statut_facture"`);
    }

}
