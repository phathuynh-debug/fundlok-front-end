// The investor charts as one module, so client.tsx can load them (and the
// Recharts they bring) as a single chunk after the page has hydrated. See the
// note on loadInvestorCharts in client.tsx.
export { CapitalFlowChart } from "./CapitalFlowChart";
export { CapitalStatusChart } from "./CapitalStatusChart";
export { IndustryAllocationChart } from "./IndustryAllocationChart";
export { IndustrySplitChart } from "./IndustrySplitChart";
export { MonthlyReturnsChart } from "./MonthlyReturnsChart";
