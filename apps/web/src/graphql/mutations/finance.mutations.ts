import { gql } from "@apollo/client";

// ==========================================
// Partner Queries & Mutations
// ==========================================

export const GET_PARTNERS_QUERY = gql`
  query GetPartners($pagination: PaginationInput) {
    partners(pagination: $pagination) {
      items {
        id
        name
        cui
        regCom
        address
        city
        country
        email
        phone
        contactPerson
        partnerType
        bankName
        bankAccount
        notes
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

export const GET_PARTNER_QUERY = gql`
  query GetPartner($id: String!) {
    partner(id: $id) {
      id
      name
      cui
      regCom
      address
      city
      country
      email
      phone
      contactPerson
      partnerType
      bankName
      bankAccount
      notes
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_PARTNER_MUTATION = gql`
  mutation CreatePartner($createPartnerInput: CreatePartnerInput!) {
    createPartner(createPartnerInput: $createPartnerInput) {
      id
      name
      cui
      partnerType
      city
      createdAt
    }
  }
`;

export const UPDATE_PARTNER_MUTATION = gql`
  mutation UpdatePartner($updatePartnerInput: UpdatePartnerInput!) {
    updatePartner(updatePartnerInput: $updatePartnerInput) {
      id
      name
      cui
      regCom
      address
      city
      country
      email
      phone
      contactPerson
      partnerType
      bankName
      bankAccount
      notes
      updatedAt
    }
  }
`;

export const DELETE_PARTNER_MUTATION = gql`
  mutation DeletePartner($id: String!) {
    deletePartner(id: $id) {
      id
    }
  }
`;

// ==========================================
// Invoice Queries & Mutations
// ==========================================

export const GET_INVOICES_QUERY = gql`
  query GetInvoices($pagination: PaginationInput) {
    invoices(pagination: $pagination) {
      items {
        id
        series
        number
        invoiceType
        status
        partnerId
        partner {
          id
          name
          cui
        }
        isClientInvoice
        issueDate
        dueDate
        subtotal
        vatTotal
        total
        paidAmount
        currency
        createdAt
      }
      meta {
        total
        skip
        take
      }
    }
  }
`;

export const GET_INVOICE_QUERY = gql`
  query GetInvoice($id: String!) {
    invoice(id: $id) {
      id
      series
      number
      invoiceType
      status
      partnerId
      partner {
        id
        name
        cui
        regCom
        address
        city
        country
        email
        phone
        bankName
        bankAccount
      }
      isClientInvoice
      issueDate
      dueDate
      deliveryDate
      subtotal
      vatTotal
      total
      paidAmount
      currency
      notes
      createdBy {
        id
        firstName
        lastName
      }
      items {
        id
        description
        quantity
        unit
        unitPrice
        vatRate
        amount
        vatAmount
      }
      payments {
        id
        amount
        paymentDate
        paymentMethod
        reference
        notes
        createdBy {
          id
          firstName
          lastName
        }
        createdAt
      }
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_INVOICE_MUTATION = gql`
  mutation CreateInvoice($createInvoiceInput: CreateInvoiceInput!) {
    createInvoice(createInvoiceInput: $createInvoiceInput) {
      id
      series
      number
      invoiceType
      status
      total
      createdAt
    }
  }
`;

export const UPDATE_INVOICE_STATUS_MUTATION = gql`
  mutation UpdateInvoiceStatus($id: String!, $status: InvoiceStatus!) {
    updateInvoiceStatus(id: $id, status: $status) {
      id
      status
      updatedAt
    }
  }
`;

export const DELETE_INVOICE_MUTATION = gql`
  mutation DeleteInvoice($id: String!) {
    deleteInvoice(id: $id) {
      id
    }
  }
`;

// ==========================================
// Payment Mutations
// ==========================================

export const CREATE_PAYMENT_MUTATION = gql`
  mutation CreatePayment($createPaymentInput: CreatePaymentInput!) {
    createPayment(createPaymentInput: $createPaymentInput) {
      id
      amount
      paymentDate
      paymentMethod
      reference
      createdAt
    }
  }
`;
