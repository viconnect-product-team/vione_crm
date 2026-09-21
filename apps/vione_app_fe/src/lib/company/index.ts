// Company (Organization) shared service — public barrel (BC-2.7).
//
// Consumers import from here. The CompanySDK is the supported client entrypoint;
// types are re-exported for convenience. Server functions call the service /
// repository directly (server side only).

export { CompanySDK } from "./company.sdk";
export { CompanyService } from "./company.service";
export { CompanyRepository } from "./company.repository";
export {
  mapRowToCompany,
  mapRowToCompanyMember,
  mapToPublicCompany,
  slugifyCompany,
} from "./company.mappers";
export * from "./company.types";
