"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityType = exports.NotificationType = exports.OrganisationStatus = exports.UserRole = exports.DocumentType = exports.PaymentMethod = exports.PaymentStatus = exports.ContratStatus = exports.FactureStatus = exports.ClientType = exports.ClientStatus = void 0;
var ClientStatus;
(function (ClientStatus) {
    ClientStatus["ACTIF"] = "ACTIF";
    ClientStatus["INACTIF"] = "INACTIF";
    ClientStatus["SUSPENDU"] = "SUSPENDU";
    ClientStatus["PROSPECT"] = "PROSPECT";
})(ClientStatus || (exports.ClientStatus = ClientStatus = {}));
var ClientType;
(function (ClientType) {
    ClientType["PARTICULIER"] = "PARTICULIER";
    ClientType["ENTREPRISE"] = "ENTREPRISE";
    ClientType["PARTENAIRE"] = "PARTENAIRE";
})(ClientType || (exports.ClientType = ClientType = {}));
var FactureStatus;
(function (FactureStatus) {
    FactureStatus["BROUILLON"] = "BROUILLON";
    FactureStatus["EMISE"] = "EMISE";
    FactureStatus["ENVOYEE"] = "ENVOYEE";
    FactureStatus["PAYEE"] = "PAYEE";
    FactureStatus["PARTIELLE"] = "PARTIELLE";
    FactureStatus["ANNULEE"] = "ANNULEE";
    FactureStatus["AVOIR"] = "AVOIR";
})(FactureStatus || (exports.FactureStatus = FactureStatus = {}));
var ContratStatus;
(function (ContratStatus) {
    ContratStatus["BROUILLON"] = "BROUILLON";
    ContratStatus["ACTIF"] = "ACTIF";
    ContratStatus["SUSPENDU"] = "SUSPENDU";
    ContratStatus["RESILIE"] = "RESILIE";
    ContratStatus["EXPIRE"] = "EXPIRE";
})(ContratStatus || (exports.ContratStatus = ContratStatus = {}));
var PaymentStatus;
(function (PaymentStatus) {
    PaymentStatus["PENDING"] = "PENDING";
    PaymentStatus["PROCESSING"] = "PROCESSING";
    PaymentStatus["SUCCEEDED"] = "SUCCEEDED";
    PaymentStatus["FAILED"] = "FAILED";
    PaymentStatus["CANCELLED"] = "CANCELLED";
    PaymentStatus["REFUNDED"] = "REFUNDED";
})(PaymentStatus || (exports.PaymentStatus = PaymentStatus = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["SEPA"] = "SEPA";
    PaymentMethod["TRANSFER"] = "TRANSFER";
    PaymentMethod["PAYPAL"] = "PAYPAL";
    PaymentMethod["CHECK"] = "CHECK";
    PaymentMethod["CASH"] = "CASH";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["FACTURE"] = "FACTURE";
    DocumentType["DEVIS"] = "DEVIS";
    DocumentType["CONTRAT"] = "CONTRAT";
    DocumentType["MANDAT"] = "MANDAT";
    DocumentType["AUTRE"] = "AUTRE";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["MANAGER"] = "MANAGER";
    UserRole["COMMERCIAL"] = "COMMERCIAL";
    UserRole["USER"] = "USER";
})(UserRole || (exports.UserRole = UserRole = {}));
var OrganisationStatus;
(function (OrganisationStatus) {
    OrganisationStatus["ACTIVE"] = "ACTIVE";
    OrganisationStatus["SUSPENDED"] = "SUSPENDED";
    OrganisationStatus["TRIAL"] = "TRIAL";
    OrganisationStatus["INACTIVE"] = "INACTIVE";
})(OrganisationStatus || (exports.OrganisationStatus = OrganisationStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["INFO"] = "INFO";
    NotificationType["SUCCESS"] = "SUCCESS";
    NotificationType["WARNING"] = "WARNING";
    NotificationType["ERROR"] = "ERROR";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var ActivityType;
(function (ActivityType) {
    ActivityType["CALL"] = "CALL";
    ActivityType["EMAIL"] = "EMAIL";
    ActivityType["MEETING"] = "MEETING";
    ActivityType["TASK"] = "TASK";
    ActivityType["NOTE"] = "NOTE";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
//# sourceMappingURL=statut.enum.js.map