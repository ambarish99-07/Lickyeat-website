import type {
  AdminAlert,
  BlogPost,
  Brand,
  Combo,
  Coupon,
  Lead,
  MenuAddOnPrice,
  MenuItem,
  Order,
  PremiumMembershipStatus,
  PricingResult,
  ReorderResult,
  StoreStatus,
  TiffinPlan,
  TiffinSingleMealOrder,
  TiffinSubscription,
  User,
} from "@lickyeat/shared-types";

export type ComboWithLive = Combo & {
  livePrice: number;
  orderable: boolean;
  constituents: MenuItem[];
};

export interface WeeklyMenuDay {
  name: string;
  imageUrl: string | null;
}
export interface WeeklyMenuResponse {
  brandId: string;
  diet: "veg" | "non-veg";
  table: Array<{ meal: string; days: WeeklyMenuDay[] }>;
}
export interface TiffinPlansResponse {
  plans: TiffinPlan[];
}
export interface SingleMealOption {
  meal: "breakfast" | "lunch" | "dinner";
  diet: "veg" | "non-veg";
  tier: "regular" | "mini" | "premium";
  date: string;
  dishName: string;
  imageUrl: string | null;
  basePrice: number;
  addOns: Array<{ name: string; price: number }>;
}

export interface BrandsResponse {
  brands: Brand[];
}
export interface BrandResponse {
  brand: Brand;
}
export interface BrandStatusResponse {
  status: StoreStatus;
}
export interface MenuItemsResponse {
  items: MenuItem[];
}
export interface CategoriesResponse {
  categories: string[];
}
export interface CombosResponse {
  combos: ComboWithLive[];
}
export interface AddOnsResponse {
  addOns: MenuAddOnPrice[];
}
export interface PricingPreviewResponse {
  pricing: PricingResult;
  couponMessage: string;
  brandId: string;
}
export interface OrderResponse {
  order: Order;
}
export interface OrdersResponse {
  orders: Order[];
}
export interface ReorderResponse {
  reorder: ReorderResult;
}
export interface TiffinSingleMealOrdersResponse {
  orders: TiffinSingleMealOrder[];
}
export interface TiffinSubscriptionsResponse {
  subscriptions: TiffinSubscription[];
}
export interface PremiumStatusResponse {
  status: PremiumMembershipStatus;
}
export interface MeResponse {
  user: User;
}
export interface CouponsResponse {
  coupons: Coupon[];
}
export interface BlogListResponse {
  posts: BlogPost[];
}
export interface BlogPostResponse {
  post: BlogPost;
}
export interface ContactResponse {
  whatsappNumber: string | null;
  supportEmail: string | null;
}
export interface CreateLeadResponse {
  lead: Lead;
  brief?: string;
}
export interface LeadsResponse {
  leads: Lead[];
}
export interface AlertsResponse {
  alerts: AdminAlert[];
}
export interface AlertCountResponse {
  total: number;
  callbacks: number;
}
