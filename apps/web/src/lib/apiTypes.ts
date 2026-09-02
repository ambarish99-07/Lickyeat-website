import type {
  Brand,
  Combo,
  Coupon,
  MenuAddOnPrice,
  MenuItem,
  Order,
  PremiumMembershipStatus,
  PricingResult,
  StoreStatus,
  TiffinSingleMealOrder,
  TiffinSubscription,
  User,
} from "@lickyeat/shared-types";

export type ComboWithLive = Combo & {
  livePrice: number;
  orderable: boolean;
  constituents: MenuItem[];
};

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
