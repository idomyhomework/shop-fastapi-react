// ── Storefront API ────────────────────────────────────────────────────────────
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { BASE_URL } from "../../config";
import type {
  Category,
  Product,
  ProductListResponse,
  ProductsQueryParams,
} from "./types";

// ── API Slice ─────────────────────────────────────────────────────────────────
// Public endpoints — no auth cookies or reauth logic needed, plain fetchBaseQuery
export const storefrontApi = createApi({
  reducerPath: "storefrontApi",
  baseQuery: fetchBaseQuery({ baseUrl: BASE_URL }),
  endpoints: (builder) => ({

    // ── Get Categories ────────────────────────────────────────────────────────
    getCategories: builder.query<Category[], void>({
      query: () => "/store/categories",
      keepUnusedDataFor: 60,
    }),

    // ── Get Products ──────────────────────────────────────────────────────────
    getProducts: builder.query<ProductListResponse, ProductsQueryParams>({
      query: (params) => ({
        url: "/store/products",
        params,
      }),
      keepUnusedDataFor: 30,
    }),

    // ── Get Single Product ────────────────────────────────────────────────────
    getProduct: builder.query<Product, number>({
      query: (id) => `/store/products/${id}`,
      keepUnusedDataFor: 30,
    }),

  }),
});

// ── Exports ───────────────────────────────────────────────────────────────────
export const {
  useGetCategoriesQuery,
  useGetProductsQuery,
  useGetProductQuery,
} = storefrontApi;
