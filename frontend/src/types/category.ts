export interface CategoryCreate {
  name: string;
  description?: string | null;
}

export interface Category extends CategoryCreate {
  id: number;
}
