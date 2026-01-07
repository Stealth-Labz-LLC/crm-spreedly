export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          display_id: number
          name: string
          slug: string
          plan: 'starter' | 'professional' | 'enterprise' | 'custom'
          status: 'trial' | 'active' | 'suspended' | 'cancelled'
          trial_ends_at: string | null
          max_users: number
          max_api_calls_per_month: number
          logo_url: string | null
          primary_color: string | null
          timezone: string
          currency: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          display_id?: number
          name: string
          slug: string
          plan?: 'starter' | 'professional' | 'enterprise' | 'custom'
          status?: 'trial' | 'active' | 'suspended' | 'cancelled'
          trial_ends_at?: string | null
          max_users?: number
          max_api_calls_per_month?: number
          logo_url?: string | null
          primary_color?: string | null
          timezone?: string
          currency?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_id?: number
          name?: string
          slug?: string
          plan?: 'starter' | 'professional' | 'enterprise' | 'custom'
          status?: 'trial' | 'active' | 'suspended' | 'cancelled'
          trial_ends_at?: string | null
          max_users?: number
          max_api_calls_per_month?: number
          logo_url?: string | null
          primary_color?: string | null
          timezone?: string
          currency?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          first_name: string | null
          last_name: string | null
          avatar_url: string | null
          current_organization_id: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          current_organization_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          first_name?: string | null
          last_name?: string | null
          avatar_url?: string | null
          current_organization_id?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member'
          status: 'invited' | 'active' | 'suspended'
          permissions: Json
          invited_by: string | null
          invited_at: string | null
          joined_at: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member'
          status?: 'invited' | 'active' | 'suspended'
          permissions?: Json
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member'
          status?: 'invited' | 'active' | 'suspended'
          permissions?: Json
          invited_by?: string | null
          invited_at?: string | null
          joined_at?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      organization_invitations: {
        Row: {
          id: string
          organization_id: string
          email: string
          role: 'admin' | 'member'
          invited_by: string
          token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          email: string
          role?: 'admin' | 'member'
          invited_by: string
          token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          email?: string
          role?: 'admin' | 'member'
          invited_by?: string
          token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          display_id: number
          email: string
          first_name: string | null
          last_name: string | null
          phone: string | null
          status: string
          customer_status: 'prospect' | 'lead' | 'partial' | 'customer' | 'declined' | 'cancelled' | 'refunded'
          source_campaign_id: string | null
          source_offer_id: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_term: string | null
          session_id: string | null
          ip_address: string | null
          user_agent: string | null
          referrer: string | null
          ship_address_1: string | null
          ship_address_2: string | null
          ship_city: string | null
          ship_state: string | null
          ship_postal_code: string | null
          ship_country: string | null
          bill_same_as_ship: boolean
          bill_address_1: string | null
          bill_address_2: string | null
          bill_city: string | null
          bill_state: string | null
          bill_postal_code: string | null
          bill_country: string | null
          decline_count: number
          last_decline_reason: string | null
          last_decline_code: string | null
          converted_at: string | null
          first_order_id: string | null
          lifetime_value: number
          total_orders: number
          custom_fields: Json
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          display_id?: number
          email: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          status?: string
          customer_status?: 'prospect' | 'lead' | 'partial' | 'customer' | 'declined' | 'cancelled' | 'refunded'
          source_campaign_id?: string | null
          source_offer_id?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_term?: string | null
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          ship_address_1?: string | null
          ship_address_2?: string | null
          ship_city?: string | null
          ship_state?: string | null
          ship_postal_code?: string | null
          ship_country?: string | null
          bill_same_as_ship?: boolean
          bill_address_1?: string | null
          bill_address_2?: string | null
          bill_city?: string | null
          bill_state?: string | null
          bill_postal_code?: string | null
          bill_country?: string | null
          decline_count?: number
          last_decline_reason?: string | null
          last_decline_code?: string | null
          converted_at?: string | null
          first_order_id?: string | null
          lifetime_value?: number
          total_orders?: number
          custom_fields?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_id?: number
          email?: string
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          status?: string
          customer_status?: 'prospect' | 'lead' | 'partial' | 'customer' | 'declined' | 'cancelled' | 'refunded'
          source_campaign_id?: string | null
          source_offer_id?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_term?: string | null
          session_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          ship_address_1?: string | null
          ship_address_2?: string | null
          ship_city?: string | null
          ship_state?: string | null
          ship_postal_code?: string | null
          ship_country?: string | null
          bill_same_as_ship?: boolean
          bill_address_1?: string | null
          bill_address_2?: string | null
          bill_city?: string | null
          bill_state?: string | null
          bill_postal_code?: string | null
          bill_country?: string | null
          decline_count?: number
          last_decline_reason?: string | null
          last_decline_code?: string | null
          converted_at?: string | null
          first_order_id?: string | null
          lifetime_value?: number
          total_orders?: number
          custom_fields?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      customer_addresses: {
        Row: {
          id: string
          customer_id: string
          type: string
          is_default: boolean
          first_name: string | null
          last_name: string | null
          address_1: string | null
          address_2: string | null
          city: string | null
          state: string | null
          postal_code: string | null
          country: string | null
          phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          type: string
          is_default?: boolean
          first_name?: string | null
          last_name?: string | null
          address_1?: string | null
          address_2?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          type?: string
          is_default?: boolean
          first_name?: string | null
          last_name?: string | null
          address_1?: string | null
          address_2?: string | null
          city?: string | null
          state?: string | null
          postal_code?: string | null
          country?: string | null
          phone?: string | null
          created_at?: string
        }
      }
      customer_payment_methods: {
        Row: {
          id: string
          customer_id: string
          spreedly_token: string
          card_type: string | null
          last_four: string | null
          exp_month: number | null
          exp_year: number | null
          is_default: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          spreedly_token: string
          card_type?: string | null
          last_four?: string | null
          exp_month?: number | null
          exp_year?: number | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          spreedly_token?: string
          card_type?: string | null
          last_four?: string | null
          exp_month?: number | null
          exp_year?: number | null
          is_default?: boolean
          is_active?: boolean
          created_at?: string
        }
      }
      products: {
        Row: {
          id: string
          display_id: number
          name: string
          sku: string | null
          description: string | null
          status: string
          billing_type: string
          price: number
          currency: string
          billing_interval: string | null
          billing_interval_count: number
          trial_days: number
          setup_fee: number
          category: string | null
          tags: string[]
          product_cost: number
          shipping_cost: number
          weight: number | null
          qty_per_order: number
          qty_available: number
          msrp: number | null
          fulfillment_type: string
          fulfillment_delay_hours: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          display_id?: number
          name: string
          sku?: string | null
          description?: string | null
          status?: string
          billing_type?: string
          price: number
          currency?: string
          billing_interval?: string | null
          billing_interval_count?: number
          trial_days?: number
          setup_fee?: number
          category?: string | null
          tags?: string[]
          product_cost?: number
          shipping_cost?: number
          weight?: number | null
          qty_per_order?: number
          qty_available?: number
          msrp?: number | null
          fulfillment_type?: string
          fulfillment_delay_hours?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_id?: number
          name?: string
          sku?: string | null
          description?: string | null
          status?: string
          billing_type?: string
          price?: number
          currency?: string
          billing_interval?: string | null
          billing_interval_count?: number
          trial_days?: number
          setup_fee?: number
          category?: string | null
          tags?: string[]
          product_cost?: number
          shipping_cost?: number
          weight?: number | null
          qty_per_order?: number
          qty_available?: number
          msrp?: number | null
          fulfillment_type?: string
          fulfillment_delay_hours?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      product_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          parent_id: string | null
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          parent_id?: string | null
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          parent_id?: string | null
          sort_order?: number
          created_at?: string
        }
      }
      gateways: {
        Row: {
          id: string
          display_id: number
          name: string
          spreedly_gateway_token: string
          gateway_type: string
          is_active: boolean
          priority: number
          monthly_cap: number | null
          current_month_volume: number
          accepted_currencies: string[]
          accepted_card_types: string[]
          min_amount: number | null
          max_amount: number | null
          descriptor: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          display_id?: number
          name: string
          spreedly_gateway_token: string
          gateway_type: string
          is_active?: boolean
          priority?: number
          monthly_cap?: number | null
          current_month_volume?: number
          accepted_currencies?: string[]
          accepted_card_types?: string[]
          min_amount?: number | null
          max_amount?: number | null
          descriptor?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_id?: number
          name?: string
          spreedly_gateway_token?: string
          gateway_type?: string
          is_active?: boolean
          priority?: number
          monthly_cap?: number | null
          current_month_volume?: number
          accepted_currencies?: string[]
          accepted_card_types?: string[]
          min_amount?: number | null
          max_amount?: number | null
          descriptor?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          display_id: number
          order_number: string
          customer_id: string | null
          campaign_id: string | null
          offer_id: string | null
          lead_id: string | null
          status: string
          payment_status: string
          fulfillment_status: string
          subtotal: number
          discount: number
          tax: number
          shipping: number
          total: number
          currency: string
          billing_address_id: string | null
          shipping_address_id: string | null
          ip_address: string | null
          notes: string | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          display_id?: number
          order_number: string
          customer_id?: string | null
          campaign_id?: string | null
          offer_id?: string | null
          lead_id?: string | null
          status?: string
          payment_status?: string
          fulfillment_status?: string
          subtotal: number
          discount?: number
          tax?: number
          shipping?: number
          total: number
          currency?: string
          billing_address_id?: string | null
          shipping_address_id?: string | null
          ip_address?: string | null
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_id?: number
          order_number?: string
          customer_id?: string | null
          campaign_id?: string | null
          offer_id?: string | null
          lead_id?: string | null
          status?: string
          payment_status?: string
          fulfillment_status?: string
          subtotal?: number
          discount?: number
          tax?: number
          shipping?: number
          total?: number
          currency?: string
          billing_address_id?: string | null
          shipping_address_id?: string | null
          ip_address?: string | null
          notes?: string | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string | null
          offer_id: string | null
          name: string
          sku: string | null
          quantity: number
          unit_price: number
          total: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id?: string | null
          offer_id?: string | null
          name: string
          sku?: string | null
          quantity: number
          unit_price: number
          total: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string | null
          offer_id?: string | null
          name?: string
          sku?: string | null
          quantity?: number
          unit_price?: number
          total?: number
          metadata?: Json
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          order_id: string | null
          customer_id: string | null
          gateway_id: string | null
          payment_method_id: string | null
          spreedly_transaction_token: string | null
          type: string
          status: string
          amount: number
          currency: string
          response_code: string | null
          response_message: string | null
          avs_result: string | null
          cvv_result: string | null
          error_code: string | null
          error_detail: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          order_id?: string | null
          customer_id?: string | null
          gateway_id?: string | null
          payment_method_id?: string | null
          spreedly_transaction_token?: string | null
          type: string
          status?: string
          amount: number
          currency?: string
          response_code?: string | null
          response_message?: string | null
          avs_result?: string | null
          cvv_result?: string | null
          error_code?: string | null
          error_detail?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string | null
          customer_id?: string | null
          gateway_id?: string | null
          payment_method_id?: string | null
          spreedly_transaction_token?: string | null
          type?: string
          status?: string
          amount?: number
          currency?: string
          response_code?: string | null
          response_message?: string | null
          avs_result?: string | null
          cvv_result?: string | null
          error_code?: string | null
          error_detail?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      transaction_logs: {
        Row: {
          id: string
          transaction_id: string
          request_body: Json | null
          response_body: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          transaction_id: string
          request_body?: Json | null
          response_body?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          transaction_id?: string
          request_body?: Json | null
          response_body?: Json | null
          created_at?: string
        }
      }
      campaigns: {
        Row: {
          id: string
          display_id: number
          name: string
          slug: string | null
          description: string | null
          status: string
          campaign_type: string
          category: string | null
          currency: string
          start_date: string | null
          end_date: string | null
          list_in_order_entry: boolean
          quality_assurance: boolean
          must_agree_tos: boolean
          preauth_only: boolean
          route_to_pinless_debit: boolean
          accept_cod: boolean
          retail_orders: boolean
          block_prepaid: boolean
          block_debit: boolean
          block_visa: boolean
          block_mastercard: boolean
          block_amex: boolean
          block_discover: boolean
          capture_on_shipment: boolean
          bundle_fulfillment: boolean
          fulfillment_delay_hours: number
          screen_with_fraud_manager: boolean
          chargeback_blacklist: boolean
          max_total_value: number
          min_total_value: number
          max_coupons: number
          reorder_days: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          display_id?: number
          name: string
          slug?: string | null
          description?: string | null
          status?: string
          campaign_type?: string
          category?: string | null
          currency?: string
          start_date?: string | null
          end_date?: string | null
          list_in_order_entry?: boolean
          quality_assurance?: boolean
          must_agree_tos?: boolean
          preauth_only?: boolean
          route_to_pinless_debit?: boolean
          accept_cod?: boolean
          retail_orders?: boolean
          block_prepaid?: boolean
          block_debit?: boolean
          block_visa?: boolean
          block_mastercard?: boolean
          block_amex?: boolean
          block_discover?: boolean
          capture_on_shipment?: boolean
          bundle_fulfillment?: boolean
          fulfillment_delay_hours?: number
          screen_with_fraud_manager?: boolean
          chargeback_blacklist?: boolean
          max_total_value?: number
          min_total_value?: number
          max_coupons?: number
          reorder_days?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_id?: number
          name?: string
          slug?: string | null
          description?: string | null
          status?: string
          campaign_type?: string
          category?: string | null
          currency?: string
          start_date?: string | null
          end_date?: string | null
          list_in_order_entry?: boolean
          quality_assurance?: boolean
          must_agree_tos?: boolean
          preauth_only?: boolean
          route_to_pinless_debit?: boolean
          accept_cod?: boolean
          retail_orders?: boolean
          block_prepaid?: boolean
          block_debit?: boolean
          block_visa?: boolean
          block_mastercard?: boolean
          block_amex?: boolean
          block_discover?: boolean
          capture_on_shipment?: boolean
          bundle_fulfillment?: boolean
          fulfillment_delay_hours?: number
          screen_with_fraud_manager?: boolean
          chargeback_blacklist?: boolean
          max_total_value?: number
          min_total_value?: number
          max_coupons?: number
          reorder_days?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      campaign_products: {
        Row: {
          id: string
          campaign_id: string
          product_id: string
          position: number
          price_override: number | null
          discount_amount: number | null
          discount_percent: number | null
          quantity_limit: number | null
          is_featured: boolean
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          product_id: string
          position?: number
          price_override?: number | null
          discount_amount?: number | null
          discount_percent?: number | null
          quantity_limit?: number | null
          is_featured?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          product_id?: string
          position?: number
          price_override?: number | null
          discount_amount?: number | null
          discount_percent?: number | null
          quantity_limit?: number | null
          is_featured?: boolean
          created_at?: string
        }
      }
      campaign_offers: {
        Row: {
          id: string
          display_id: number
          campaign_id: string
          name: string
          description: string | null
          offer_type: string
          product_id: string | null
          price_override: number | null
          discount_type: string | null
          discount_value: number | null
          billing_model_id: string | null
          position: number
          is_active: boolean
          metadata: Json
          created_at: string
          updated_at: string
          // Billing schedule fields
          billing_type: string
          gateway_id: string | null
          display_name: string | null
          dynamic_descriptor: string | null
          qty_per_order: number
          ship_price: number
          final_billing_cycle: number | null
          fixed_billing_day: number | null
          persistent_rebill_day: boolean
          stagger_fulfillments: boolean
          stagger_payments: boolean
          use_chargeback_protection: boolean
          delay_fulfillment_on_rebill: boolean
          fulfillment_delay_days: number
          bill_on_saturday: boolean
          bundle_subscriptions: boolean
          block_prepaid_cards: boolean
          stand_alone_transaction: boolean
          // Trial options
          trial_enabled: boolean
          trial_type: string | null
          trial_auth_type: string
          trial_days: number
          trial_price: number
          allow_multiple_trials: boolean
          // Order limits
          max_price: number | null
          max_quantity: number | null
        }
        Insert: {
          id?: string
          display_id?: number
          campaign_id: string
          name: string
          description?: string | null
          offer_type?: string
          product_id?: string | null
          price_override?: number | null
          discount_type?: string | null
          discount_value?: number | null
          billing_model_id?: string | null
          position?: number
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
          billing_type?: string
          gateway_id?: string | null
          display_name?: string | null
          dynamic_descriptor?: string | null
          qty_per_order?: number
          ship_price?: number
          final_billing_cycle?: number | null
          fixed_billing_day?: number | null
          persistent_rebill_day?: boolean
          stagger_fulfillments?: boolean
          stagger_payments?: boolean
          use_chargeback_protection?: boolean
          delay_fulfillment_on_rebill?: boolean
          fulfillment_delay_days?: number
          bill_on_saturday?: boolean
          bundle_subscriptions?: boolean
          block_prepaid_cards?: boolean
          stand_alone_transaction?: boolean
          trial_enabled?: boolean
          trial_type?: string | null
          trial_auth_type?: string
          trial_days?: number
          trial_price?: number
          allow_multiple_trials?: boolean
          max_price?: number | null
          max_quantity?: number | null
        }
        Update: {
          id?: string
          display_id?: number
          campaign_id?: string
          name?: string
          description?: string | null
          offer_type?: string
          product_id?: string | null
          price_override?: number | null
          discount_type?: string | null
          discount_value?: number | null
          billing_model_id?: string | null
          position?: number
          is_active?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
          billing_type?: string
          gateway_id?: string | null
          display_name?: string | null
          dynamic_descriptor?: string | null
          qty_per_order?: number
          ship_price?: number
          final_billing_cycle?: number | null
          fixed_billing_day?: number | null
          persistent_rebill_day?: boolean
          stagger_fulfillments?: boolean
          stagger_payments?: boolean
          use_chargeback_protection?: boolean
          delay_fulfillment_on_rebill?: boolean
          fulfillment_delay_days?: number
          bill_on_saturday?: boolean
          bundle_subscriptions?: boolean
          block_prepaid_cards?: boolean
          stand_alone_transaction?: boolean
          trial_enabled?: boolean
          trial_type?: string | null
          trial_auth_type?: string
          trial_days?: number
          trial_price?: number
          allow_multiple_trials?: boolean
          max_price?: number | null
          max_quantity?: number | null
        }
      }
      offer_billing_cycles: {
        Row: {
          id: string
          offer_id: string
          cycle_number: number
          price: number
          ship_price: number
          bill_delay_days: number
          is_shippable: boolean
          product_id: string | null
          combination_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          offer_id: string
          cycle_number: number
          price?: number
          ship_price?: number
          bill_delay_days?: number
          is_shippable?: boolean
          product_id?: string | null
          combination_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          offer_id?: string
          cycle_number?: number
          price?: number
          ship_price?: number
          bill_delay_days?: number
          is_shippable?: boolean
          product_id?: string | null
          combination_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      campaign_upsells: {
        Row: {
          id: string
          display_id: number
          campaign_id: string
          name: string
          description: string | null
          trigger_product_id: string | null
          upsell_product_id: string | null
          discount_type: string | null
          discount_value: number | null
          position: number
          is_active: boolean
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          display_id?: number
          campaign_id: string
          name: string
          description?: string | null
          trigger_product_id?: string | null
          upsell_product_id?: string | null
          discount_type?: string | null
          discount_value?: number | null
          position?: number
          is_active?: boolean
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          display_id?: number
          campaign_id?: string
          name?: string
          description?: string | null
          trigger_product_id?: string | null
          upsell_product_id?: string | null
          discount_type?: string | null
          discount_value?: number | null
          position?: number
          is_active?: boolean
          metadata?: Json
          created_at?: string
        }
      }
      campaign_countries: {
        Row: {
          id: string
          campaign_id: string
          country_code: string
          country_name: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          country_code: string
          country_name: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          country_code?: string
          country_name?: string
          is_active?: boolean
          created_at?: string
        }
      }
      campaign_shipping_options: {
        Row: {
          id: string
          campaign_id: string
          name: string
          carrier: string | null
          method: string | null
          base_cost: number
          per_item_cost: number
          free_threshold: number | null
          estimated_days_min: number | null
          estimated_days_max: number | null
          is_active: boolean
          position: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          name: string
          carrier?: string | null
          method?: string | null
          base_cost?: number
          per_item_cost?: number
          free_threshold?: number | null
          estimated_days_min?: number | null
          estimated_days_max?: number | null
          is_active?: boolean
          position?: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          name?: string
          carrier?: string | null
          method?: string | null
          base_cost?: number
          per_item_cost?: number
          free_threshold?: number | null
          estimated_days_min?: number | null
          estimated_days_max?: number | null
          is_active?: boolean
          position?: number
          metadata?: Json
          created_at?: string
        }
      }
      campaign_sales_tax: {
        Row: {
          id: string
          campaign_id: string
          country_code: string
          state_code: string | null
          tax_rate: number
          tax_name: string | null
          is_inclusive: boolean
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          country_code: string
          state_code?: string | null
          tax_rate: number
          tax_name?: string | null
          is_inclusive?: boolean
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          country_code?: string
          state_code?: string | null
          tax_rate?: number
          tax_name?: string | null
          is_inclusive?: boolean
          is_active?: boolean
          created_at?: string
        }
      }
      campaign_coupons: {
        Row: {
          id: string
          campaign_id: string
          code: string
          name: string | null
          description: string | null
          discount_type: string
          discount_value: number
          min_order_value: number | null
          max_uses: number | null
          uses_per_customer: number
          current_uses: number
          start_date: string | null
          end_date: string | null
          is_active: boolean
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          code: string
          name?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          min_order_value?: number | null
          max_uses?: number | null
          uses_per_customer?: number
          current_uses?: number
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          code?: string
          name?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          min_order_value?: number | null
          max_uses?: number | null
          uses_per_customer?: number
          current_uses?: number
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          metadata?: Json
          created_at?: string
        }
      }
      campaign_surcharges: {
        Row: {
          id: string
          campaign_id: string
          name: string
          surcharge_type: string | null
          amount: number | null
          percentage: number | null
          apply_to: string
          is_active: boolean
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          name: string
          surcharge_type?: string | null
          amount?: number | null
          percentage?: number | null
          apply_to?: string
          is_active?: boolean
          position?: number
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          name?: string
          surcharge_type?: string | null
          amount?: number | null
          percentage?: number | null
          apply_to?: string
          is_active?: boolean
          position?: number
          created_at?: string
        }
      }
      campaign_scripts: {
        Row: {
          id: string
          campaign_id: string
          name: string
          script_type: string
          script_content: string | null
          is_active: boolean
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          name: string
          script_type: string
          script_content?: string | null
          is_active?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          name?: string
          script_type?: string
          script_content?: string | null
          is_active?: boolean
          position?: number
          created_at?: string
          updated_at?: string
        }
      }
      campaign_call_centers: {
        Row: {
          id: string
          campaign_id: string
          name: string
          phone_number: string
          hours_of_operation: string | null
          timezone: string
          is_default: boolean
          is_active: boolean
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          name: string
          phone_number: string
          hours_of_operation?: string | null
          timezone?: string
          is_default?: boolean
          is_active?: boolean
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          name?: string
          phone_number?: string
          hours_of_operation?: string | null
          timezone?: string
          is_default?: boolean
          is_active?: boolean
          metadata?: Json
          created_at?: string
        }
      }
      campaign_emails: {
        Row: {
          id: string
          campaign_id: string
          email_type: string
          name: string | null
          subject: string
          body_html: string | null
          body_text: string | null
          from_name: string | null
          from_email: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          email_type: string
          name?: string | null
          subject: string
          body_html?: string | null
          body_text?: string | null
          from_name?: string | null
          from_email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          email_type?: string
          name?: string | null
          subject?: string
          body_html?: string | null
          body_text?: string | null
          from_name?: string | null
          from_email?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      campaign_sms: {
        Row: {
          id: string
          campaign_id: string
          sms_type: string
          name: string | null
          message_template: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          sms_type: string
          name?: string | null
          message_template: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          sms_type?: string
          name?: string | null
          message_template?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      campaign_custom_fields: {
        Row: {
          id: string
          campaign_id: string
          field_name: string
          field_type: string
          field_label: string
          placeholder: string | null
          is_required: boolean
          options: Json
          validation_rules: Json
          position: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          field_name: string
          field_type: string
          field_label: string
          placeholder?: string | null
          is_required?: boolean
          options?: Json
          validation_rules?: Json
          position?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          field_name?: string
          field_type?: string
          field_label?: string
          placeholder?: string | null
          is_required?: boolean
          options?: Json
          validation_rules?: Json
          position?: number
          is_active?: boolean
          created_at?: string
        }
      }
      campaign_terms_of_service: {
        Row: {
          id: string
          campaign_id: string
          version: string
          title: string
          content: string
          is_active: boolean
          effective_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          version: string
          title?: string
          content: string
          is_active?: boolean
          effective_date?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          version?: string
          title?: string
          content?: string
          is_active?: boolean
          effective_date?: string
          created_at?: string
          updated_at?: string
        }
      }
      campaign_blocked_bins: {
        Row: {
          id: string
          campaign_id: string
          bin_prefix: string
          reason: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          bin_prefix: string
          reason?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          bin_prefix?: string
          reason?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      campaign_analytics: {
        Row: {
          id: string
          campaign_id: string
          metric_date: string
          impressions: number
          clicks: number
          orders_count: number
          orders_value: number
          refunds_count: number
          refunds_value: number
          conversion_rate: number
          avg_order_value: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          campaign_id: string
          metric_date: string
          impressions?: number
          clicks?: number
          orders_count?: number
          orders_value?: number
          refunds_count?: number
          refunds_value?: number
          conversion_rate?: number
          avg_order_value?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          campaign_id?: string
          metric_date?: string
          impressions?: number
          clicks?: number
          orders_count?: number
          orders_value?: number
          refunds_count?: number
          refunds_value?: number
          conversion_rate?: number
          avg_order_value?: number
          created_at?: string
          updated_at?: string
        }
      }
      campaign_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      leads: {
        Row: {
          id: string
          display_id: number
          campaign_id: string
          offer_id: string
          status: 'prospect' | 'lead' | 'partial' | 'paid' | 'declined'
          email: string | null
          first_name: string | null
          last_name: string | null
          phone: string | null
          ship_address_1: string | null
          ship_address_2: string | null
          ship_city: string | null
          ship_state: string | null
          ship_postal_code: string | null
          ship_country: string | null
          bill_same_as_ship: boolean
          bill_address_1: string | null
          bill_address_2: string | null
          bill_city: string | null
          bill_state: string | null
          bill_postal_code: string | null
          bill_country: string | null
          spreedly_payment_token: string | null
          card_type: string | null
          card_last_four: string | null
          card_exp_month: number | null
          card_exp_year: number | null
          ip_address: string | null
          user_agent: string | null
          referrer: string | null
          utm_source: string | null
          utm_medium: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_term: string | null
          session_id: string | null
          customer_id: string | null
          order_id: string | null
          converted_at: string | null
          decline_count: number
          last_decline_reason: string | null
          last_decline_code: string | null
          subtotal: number
          shipping: number
          tax: number
          discount: number
          total: number
          custom_fields: Json
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          display_id?: number
          campaign_id: string
          offer_id: string
          status?: 'prospect' | 'lead' | 'partial' | 'paid' | 'declined'
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          ship_address_1?: string | null
          ship_address_2?: string | null
          ship_city?: string | null
          ship_state?: string | null
          ship_postal_code?: string | null
          ship_country?: string | null
          bill_same_as_ship?: boolean
          bill_address_1?: string | null
          bill_address_2?: string | null
          bill_city?: string | null
          bill_state?: string | null
          bill_postal_code?: string | null
          bill_country?: string | null
          spreedly_payment_token?: string | null
          card_type?: string | null
          card_last_four?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_term?: string | null
          session_id?: string | null
          customer_id?: string | null
          order_id?: string | null
          converted_at?: string | null
          decline_count?: number
          last_decline_reason?: string | null
          last_decline_code?: string | null
          subtotal?: number
          shipping?: number
          tax?: number
          discount?: number
          total?: number
          custom_fields?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_id?: number
          campaign_id?: string
          offer_id?: string
          status?: 'prospect' | 'lead' | 'partial' | 'paid' | 'declined'
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          phone?: string | null
          ship_address_1?: string | null
          ship_address_2?: string | null
          ship_city?: string | null
          ship_state?: string | null
          ship_postal_code?: string | null
          ship_country?: string | null
          bill_same_as_ship?: boolean
          bill_address_1?: string | null
          bill_address_2?: string | null
          bill_city?: string | null
          bill_state?: string | null
          bill_postal_code?: string | null
          bill_country?: string | null
          spreedly_payment_token?: string | null
          card_type?: string | null
          card_last_four?: string | null
          card_exp_month?: number | null
          card_exp_year?: number | null
          ip_address?: string | null
          user_agent?: string | null
          referrer?: string | null
          utm_source?: string | null
          utm_medium?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_term?: string | null
          session_id?: string | null
          customer_id?: string | null
          order_id?: string | null
          converted_at?: string | null
          decline_count?: number
          last_decline_reason?: string | null
          last_decline_code?: string | null
          subtotal?: number
          shipping?: number
          tax?: number
          discount?: number
          total?: number
          custom_fields?: Json
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      lead_status_history: {
        Row: {
          id: string
          lead_id: string
          from_status: string | null
          to_status: string
          changed_by: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          from_status?: string | null
          to_status: string
          changed_by?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          from_status?: string | null
          to_status?: string
          changed_by?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      api_settings: {
        Row: {
          id: string
          api_key: string
          api_secret: string
          is_active: boolean
          rate_limit_per_minute: number
          rate_limit_per_day: number
          allowed_origins: string[]
          webhook_url: string | null
          webhook_events: string[]
          webhook_secret: string
          name: string
          description: string | null
          last_used_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          api_key?: string
          api_secret?: string
          is_active?: boolean
          rate_limit_per_minute?: number
          rate_limit_per_day?: number
          allowed_origins?: string[]
          webhook_url?: string | null
          webhook_events?: string[]
          webhook_secret?: string
          name?: string
          description?: string | null
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          api_key?: string
          api_secret?: string
          is_active?: boolean
          rate_limit_per_minute?: number
          rate_limit_per_day?: number
          allowed_origins?: string[]
          webhook_url?: string | null
          webhook_events?: string[]
          webhook_secret?: string
          name?: string
          description?: string | null
          last_used_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customer_status_history: {
        Row: {
          id: string
          customer_id: string
          from_status: string | null
          to_status: string
          changed_by: string | null
          reason: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          from_status?: string | null
          to_status: string
          changed_by?: string | null
          reason?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          from_status?: string | null
          to_status?: string
          changed_by?: string | null
          reason?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      api_request_log: {
        Row: {
          id: string
          api_key_id: string | null
          endpoint: string
          method: string
          request_body: Json | null
          response_status: number | null
          response_body: Json | null
          ip_address: string | null
          user_agent: string | null
          duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          api_key_id?: string | null
          endpoint: string
          method: string
          request_body?: Json | null
          response_status?: number | null
          response_body?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          duration_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          api_key_id?: string | null
          endpoint?: string
          method?: string
          request_body?: Json | null
          response_status?: number | null
          response_body?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          duration_ms?: number | null
          created_at?: string
        }
      }
      connected_domains: {
        Row: {
          id: string
          domain: string
          campaign_id: string | null
          is_active: boolean
          ssl_verified: boolean
          allow_test_mode: boolean
          auto_capture: boolean
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          domain: string
          campaign_id?: string | null
          is_active?: boolean
          ssl_verified?: boolean
          allow_test_mode?: boolean
          auto_capture?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          domain?: string
          campaign_id?: string | null
          is_active?: boolean
          ssl_verified?: boolean
          allow_test_mode?: boolean
          auto_capture?: boolean
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization_with_owner: {
        Args: {
          p_user_id: string
          p_user_email: string
          p_org_name: string
          p_org_slug: string
          p_plan?: string
        }
        Returns: string
      }
      switch_current_organization: {
        Args: {
          p_user_id: string
          p_org_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Convenience types
export type Customer = Tables<'customers'>
export type CustomerAddress = Tables<'customer_addresses'>
export type CustomerPaymentMethod = Tables<'customer_payment_methods'>
export type Product = Tables<'products'>
export type ProductCategory = Tables<'product_categories'>
export type Gateway = Tables<'gateways'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type Transaction = Tables<'transactions'>
export type TransactionLog = Tables<'transaction_logs'>

// Campaign types
export type Campaign = Tables<'campaigns'>
export type CampaignCategory = Tables<'campaign_categories'>
export type CampaignProduct = Tables<'campaign_products'>
export type CampaignOffer = Tables<'campaign_offers'>
export type OfferBillingCycle = Tables<'offer_billing_cycles'>
export type CampaignUpsell = Tables<'campaign_upsells'>
export type CampaignCountry = Tables<'campaign_countries'>
export type CampaignShippingOption = Tables<'campaign_shipping_options'>
export type CampaignSalesTax = Tables<'campaign_sales_tax'>
export type CampaignCoupon = Tables<'campaign_coupons'>
export type CampaignSurcharge = Tables<'campaign_surcharges'>
export type CampaignScript = Tables<'campaign_scripts'>
export type CampaignCallCenter = Tables<'campaign_call_centers'>
export type CampaignEmail = Tables<'campaign_emails'>
export type CampaignSms = Tables<'campaign_sms'>
export type CampaignCustomField = Tables<'campaign_custom_fields'>
export type CampaignTermsOfService = Tables<'campaign_terms_of_service'>
export type CampaignBlockedBin = Tables<'campaign_blocked_bins'>
export type CampaignAnalytics = Tables<'campaign_analytics'>

// Lead types
export type Lead = Tables<'leads'>
export type LeadStatusHistory = Tables<'lead_status_history'>
export type LeadStatus = Lead['status']

// API types
export type ApiSettings = Tables<'api_settings'>
export type CustomerStatusHistory = Tables<'customer_status_history'>
export type ApiRequestLog = Tables<'api_request_log'>
export type ConnectedDomain = Tables<'connected_domains'>
export type CustomerStatus = Customer['customer_status']
