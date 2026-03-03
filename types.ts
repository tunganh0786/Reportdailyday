
export type Market = 'ML' | 'TH' | 'SG';

export interface CampaignItem {
  id: string;
  name: string;
  market: Market;
  ds: string;
  cpi: string;
  cpiInput: string;
  percentCpi: string;
  orders: string;
  pricePerOrder: string;
  ordersCount: string;
  notes: string[];
  diePage: boolean;
  rejected: boolean;
}

export interface ReportState {
  userName: string;
  time: string;
  date: string;
  items: CampaignItem[];
  productCatalog: string[]; // Danh sách tên sản phẩm lưu nhanh
}
