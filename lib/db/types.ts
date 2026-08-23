// Hand-written types mirroring supabase/migrations/0001_init.sql.
// If you later run `supabase gen types typescript`, that generated file can
// replace this one - keep the shapes in sync until then.

export type ListingStatus = "pending_payment" | "published" | "unpublished";
export type PaymentStatus = "pending" | "completed" | "failed" | "refunded";
export type PaymentProvider = "lemonsqueezy" | "manual";
export type ReportStatus = "open" | "reviewed" | "dismissed";

// These are `type`, not `interface`, on purpose: the Database.Tables/Views
// entries below need to structurally satisfy supabase-js's
// Record<string, unknown> constraints, and plain interfaces (unlike type
// aliases) don't pick up an implicit index signature for that check - an
// interface here would silently collapse every query's row type to `never`.
export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  display_order: number;
  min_bid_cents: number;
  created_at: string;
  updated_at: string;
};

export type Listing = {
  id: string;
  category_id: string;
  provider_name: string;
  pitch: string;
  destination_link: string;
  /** Normalized copy of destination_link for duplicate-URL lookup - see lib/link-policy.ts's normalizeUrlKey. */
  destination_link_key: string | null;
  logo_url: string | null;
  bid_amount_cents: number;
  status: ListingStatus;
  manage_token_hash: string;
  manage_token_encrypted: string | null;
  is_verified: boolean;
  click_count: number;
  claimed_at: string | null;
  created_at: string;
  updated_at: string;
};

/** A row from the `listing_ranks` view: a published listing plus its computed rank. */
export type ListingWithRank = Listing & {
  rank: number;
};

export type Payment = {
  id: string;
  listing_id: string;
  amount_cents: number;
  provider: PaymentProvider | (string & {});
  provider_payment_id: string | null;
  status: PaymentStatus;
  created_at: string;
  completed_at: string | null;
};

/** Minimal shape returned by the `category_top_price_cents` RPC. */
export type CategoryPricing = {
  currentTopCents: number | null;
  claimFirstPriceCents: number;
  minBidCents: number;
};

export type Report = {
  id: string;
  listing_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
};

export type SiteVisit = {
  session_id: string;
  last_seen: string;
};

export type ClickEvent = {
  id: string;
  listing_id: string;
  category_id: string;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: Category;
        Insert: Partial<Category> & Pick<Category, "name" | "slug">;
        Update: Partial<Category>;
        Relationships: [];
      };
      listings: {
        Row: Listing;
        Insert: Partial<Listing> &
          Pick<
            Listing,
            "category_id" | "provider_name" | "pitch" | "destination_link" | "bid_amount_cents" | "manage_token_hash"
          >;
        Update: Partial<Listing>;
        Relationships: [
          {
            foreignKeyName: "listings_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: Payment;
        Insert: Partial<Payment> & Pick<Payment, "listing_id" | "amount_cents">;
        Update: Partial<Payment>;
        Relationships: [
          {
            foreignKeyName: "payments_listing_id_fkey";
            columns: ["listing_id"];
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: Report;
        Insert: Partial<Report> & Pick<Report, "listing_id" | "reason">;
        Update: Partial<Report>;
        Relationships: [
          {
            foreignKeyName: "reports_listing_id_fkey";
            columns: ["listing_id"];
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
      site_visits: {
        Row: SiteVisit;
        Insert: Partial<SiteVisit> & Pick<SiteVisit, "session_id">;
        Update: Partial<SiteVisit>;
        Relationships: [];
      };
      click_events: {
        Row: ClickEvent;
        Insert: Partial<ClickEvent> & Pick<ClickEvent, "listing_id" | "category_id">;
        Update: Partial<ClickEvent>;
        Relationships: [
          {
            foreignKeyName: "click_events_listing_id_fkey";
            columns: ["listing_id"];
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "click_events_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      listing_ranks: {
        Row: ListingWithRank;
        Relationships: [];
      };
    };
    Functions: {
      category_top_price_cents: {
        Args: { p_category_id: string };
        Returns: number;
      };
      increment_listing_click_count: {
        Args: { p_listing_id: string };
        Returns: void;
      };
    };
  };
}
