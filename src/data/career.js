import { aiAdvantageUrl } from "../links";

// Resume revision 38, with Alex's later portfolio-specific scale and date corrections.
export const career = [
  {
    id: "deloitte", role: "Head of Engineering", company: "AI Advantage, Deloitte", date: "March 2022 – Present",
    summary: "I lead a core team of 15 engineers delivering AI for finance, from product architecture and client discussions through production.",
    link: aiAdvantageUrl, linkLabel: "AI Advantage",
    scale: { name: "AI Advantage", joinCount: 12, approximateJoin: true, laterCount: 100, laterPlus: true, scopeNote: "Organization size, separate from my 15-engineer core team." }
  },
  {
    id: "fordham", role: "Research Assistant", company: "Fordham University", date: "March 2020 – December 2021",
    summary: "Designed the 2021 disability data report presented to the UN and WHO, and built the Global Disability Data Initiative website.",
    link: "https://www.disabilitydatainitiative.org/reports/disability-data-initiative-2021-report/", linkLabel: "Disability Data Initiative"
  },
  {
    id: "columbia", role: "Research Assistant", company: "Columbia University", date: "October 2020 – December 2020",
    summary: "Built Python data-collection and video-metadata workflows for Qun Wang’s Google video search research at the Tow Center for Digital Journalism.",
    link: "https://towcenter.columbia.edu/content/research-projects-0", linkLabel: "Tow Center Research"
  },
  {
    id: "brokr", role: "Co-Owner & CTO", company: "BROKR.com LLC", date: "March 2017 – March 2020",
    summary: "Built CRM and pipelines handling approximately $2M in monthly lead volume, helping a two-person real estate firm grow into a 21-person SaaS company.",
    scale: { name: "BROKR", joinCount: 3, joinOrdinal: 3, laterCount: 21, scopeNote: "Company size, not direct reports." }
  },
  {
    id: "pure-digital", role: "Account Manager & Lead Developer", company: "Pure Digital", date: "April 2015 – March 2017",
    summary: "Led software development and technical SEO with three direct reports, improving client acquisition and conversion as the company grew to 16.",
    link: "https://puredigitalco.com/", linkLabel: "Pure Digital",
    scale: { name: "Pure Digital", joinCount: 4, joinOrdinal: 4, laterCount: 16, scopeNote: "Company size. My department had three direct reports." }
  },
  {
    id: "apc", role: "Founder", company: "APC Technology Group", date: "August 2009 – April 2015",
    summary: "Founded a hosting business at 14, serving 800+ clients on company-owned Linux and Windows servers co-located in IBM (SoftLayer) data centers."
  }
];
