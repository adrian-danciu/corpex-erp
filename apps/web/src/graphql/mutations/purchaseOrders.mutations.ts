import { gql } from "@apollo/client";

const PURCHASE_ORDER_LINE_FIELDS = `
  id
  orderId
  productId
  qtyOrdered
  qtyReceived
  qtyOutstanding
  unitCost
  notes
  product {
    id
    sku
    name
    unit
  }
`;

const PURCHASE_ORDER_RECEIPT_FIELDS = `
  id
  orderId
  nirSeries
  nirNumber
  formattedNumber
  receivedDate
  notes
  createdById
  createdAt
  createdBy {
    id
    firstName
    lastName
  }
  lines {
    id
    receiptId
    orderLineId
    qtyReceived
    orderLine {
      id
      productId
      unitCost
      product {
        id
        sku
        name
        unit
      }
    }
  }
`;

const PURCHASE_ORDER_FIELDS = `
  id
  series
  number
  formattedNumber
  supplierId
  warehouseId
  status
  orderDate
  expectedDate
  currency
  subtotal
  notes
  cancelledAt
  cancelReason
  createdById
  createdAt
  updatedAt
  supplier {
    id
    name
    cui
    partnerType
  }
  warehouse {
    id
    code
    name
  }
  createdBy {
    id
    firstName
    lastName
  }
  lines {
    ${PURCHASE_ORDER_LINE_FIELDS}
  }
  receipts {
    ${PURCHASE_ORDER_RECEIPT_FIELDS}
  }
`;

export const GET_PURCHASE_ORDERS_QUERY = gql`
  query GetPurchaseOrders(
    $pagination: PaginationInput
    $filter: PurchaseOrderFilterInput
  ) {
    purchaseOrders(pagination: $pagination, filter: $filter) {
      items {
        id
        series
        number
        formattedNumber
        status
        orderDate
        expectedDate
        currency
        subtotal
        supplierId
        warehouseId
        supplier {
          id
          name
        }
        warehouse {
          id
          code
          name
        }
        createdBy {
          id
          firstName
          lastName
        }
        lines {
          id
          productId
          qtyOrdered
          qtyReceived
          qtyOutstanding
          unitCost
          product {
            id
            sku
            name
            unit
          }
        }
        receipts {
          id
          formattedNumber
          receivedDate
          lines {
            id
            receiptId
            orderLineId
            qtyReceived
            orderLine {
              id
              productId
              unitCost
              product {
                id
                sku
                name
                unit
              }
            }
          }
        }
      }
      meta {
        total
        skip
        take
      }
    }
  }
`;

export const GET_PURCHASE_ORDER_QUERY = gql`
  query GetPurchaseOrder($id: ID!) {
    purchaseOrder(id: $id) {
      ${PURCHASE_ORDER_FIELDS}
    }
  }
`;

export const GET_IN_TRANSIT_SUMMARY_QUERY = gql`
  query GetInTransitSummary($warehouseId: ID) {
    inTransitSummary(warehouseId: $warehouseId) {
      productId
      productSku
      productName
      qtyInTransit
      openOrderCount
      earliestExpectedDate
    }
  }
`;

export const GET_IN_TRANSIT_BY_PRODUCT_QUERY = gql`
  query GetInTransitByProduct($productId: ID!, $warehouseId: ID) {
    inTransitByProduct(productId: $productId, warehouseId: $warehouseId) {
      productId
      warehouseId
      supplierId
      supplierName
      qtyInTransit
      earliestExpectedDate
      orderIds
    }
  }
`;

export const CREATE_PURCHASE_ORDER_MUTATION = gql`
  mutation CreatePurchaseOrder($input: CreatePurchaseOrderInput!) {
    createPurchaseOrder(input: $input) {
      ${PURCHASE_ORDER_FIELDS}
    }
  }
`;

export const UPDATE_PURCHASE_ORDER_MUTATION = gql`
  mutation UpdatePurchaseOrder($input: UpdatePurchaseOrderInput!) {
    updatePurchaseOrder(input: $input) {
      ${PURCHASE_ORDER_FIELDS}
    }
  }
`;

export const CONFIRM_PURCHASE_ORDER_MUTATION = gql`
  mutation ConfirmPurchaseOrder($id: ID!) {
    confirmPurchaseOrder(id: $id) {
      ${PURCHASE_ORDER_FIELDS}
    }
  }
`;

export const CANCEL_PURCHASE_ORDER_MUTATION = gql`
  mutation CancelPurchaseOrder($id: ID!, $reason: String) {
    cancelPurchaseOrder(id: $id, reason: $reason) {
      ${PURCHASE_ORDER_FIELDS}
    }
  }
`;

export const RECORD_PURCHASE_ORDER_RECEIPT_MUTATION = gql`
  mutation RecordPurchaseOrderReceipt($input: RecordReceiptInput!) {
    recordPurchaseOrderReceipt(input: $input) {
      ${PURCHASE_ORDER_RECEIPT_FIELDS}
    }
  }
`;

export const DELETE_PURCHASE_ORDER_MUTATION = gql`
  mutation DeletePurchaseOrder($id: ID!) {
    deletePurchaseOrder(id: $id)
  }
`;
