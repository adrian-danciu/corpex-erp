import { gql } from "@apollo/client";

export const GET_STOCK_OVERVIEW_QUERY = gql`
  query GetStockOverview {
    stockOverview {
      totalProducts
      totalWarehouses
      lowStockProducts
      totalStockUnits
    }
  }
`;

export const GET_PRODUCTS_QUERY = gql`
  query GetProducts($pagination: PaginationInput, $search: String) {
    products(pagination: $pagination, search: $search) {
      items {
        id
        sku
        name
        description
        unit
        category
        minimumStock
        currentStock
        unitPrice
        isActive
        createdAt
        updatedAt
      }
      meta {
        total
        skip
        take
      }
    }
  }
`;

export const GET_PRODUCT_STOCK_BY_PRODUCT_QUERY = gql`
  query GetProductStockByProduct($productId: String!) {
    productStockByProduct(productId: $productId) {
      id
      productId
      warehouseId
      quantity
      reservedQty
      availableQty
      warehouse {
        id
        code
        name
      }
    }
  }
`;

export const UPDATE_PRODUCT_MUTATION = gql`
  mutation UpdateProduct($input: UpdateProductInput!) {
    updateProduct(input: $input) {
      id
      name
      description
      unit
      category
      minimumStock
      unitPrice
      isActive
      updatedAt
    }
  }
`;

export const GET_WAREHOUSES_QUERY = gql`
  query GetWarehouses($pagination: PaginationInput) {
    warehouses(pagination: $pagination) {
      items {
        id
        name
        code
        address
        city
        country
        isActive
        createdAt
        updatedAt
      }
      meta {
        total
        skip
        take
      }
    }
  }
`;

export const GET_LOW_STOCK_PRODUCTS_QUERY = gql`
  query GetLowStockProducts {
    lowStockProducts {
      id
      sku
      name
      unit
      minimumStock
      currentStock
    }
  }
`;

export const GET_STOCK_MOVEMENTS_QUERY = gql`
  query GetStockMovements(
    $pagination: PaginationInput
    $filter: StockMovementFilterInput
  ) {
    stockMovements(pagination: $pagination, filter: $filter) {
      id
      productId
      warehouseId
      type
      quantity
      unitCost
      reference
      notes
      performedAt
      createdById
      createdAt
      product {
        id
        sku
        name
        unit
      }
      warehouse {
        id
        name
        code
      }
      createdBy {
        id
        firstName
        lastName
      }
    }
  }
`;

export const CREATE_PRODUCT_MUTATION = gql`
  mutation CreateProduct($createProductInput: CreateProductInput!) {
    createProduct(createProductInput: $createProductInput) {
      id
      sku
      name
      description
      unit
      category
      minimumStock
      currentStock
      unitPrice
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_WAREHOUSE_MUTATION = gql`
  mutation CreateWarehouse($createWarehouseInput: CreateWarehouseInput!) {
    createWarehouse(createWarehouseInput: $createWarehouseInput) {
      id
      name
      code
      address
      city
      country
      isActive
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_STOCK_MOVEMENT_MUTATION = gql`
  mutation CreateStockMovement(
    $createStockMovementInput: CreateStockMovementInput!
  ) {
    createStockMovement(createStockMovementInput: $createStockMovementInput) {
      id
      type
      quantity
      unitCost
      reference
      notes
      performedAt
      createdAt
      product {
        id
        sku
        name
        unit
      }
      warehouse {
        id
        name
        code
      }
      createdBy {
        id
        firstName
        lastName
      }
    }
  }
`;
