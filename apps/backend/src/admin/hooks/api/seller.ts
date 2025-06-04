import {
  QueryKey,
  UseMutationOptions,
  UseQueryOptions,
  useMutation,
  useQuery
} from '@tanstack/react-query'

import { VendorSeller } from '@mercurjs/http-client'

import { api } from '../../lib/client'
import { queryKeysFactory } from '../../lib/query-keys-factory'

export const sellerQueryKeys = queryKeysFactory('seller')

type CreateSellerPayload = {
  name: string
  member: {
    name: string
    email: string
  }
}

// Hook for fetching sellers
export const useSellers = (
  query?: Parameters<typeof api.admin.adminListSellers>[0],
  options?: Omit<
    UseQueryOptions<
      Parameters<typeof api.admin.adminListSellers>[0],
      Error,
      { sellers: any[]; count?: number },
      QueryKey
    >,
    'queryFn' | 'queryKey'
  >
) => {
  const { data, ...other } = useQuery({
    queryKey: sellerQueryKeys.list(query),
    queryFn: () => api.admin.adminListSellers(query).then((res) => res.data),
    ...options
  })

  return { ...data, ...other }
}

// Hook for creating a new seller
export const useCreateSeller = (
  options?: UseMutationOptions<
    { seller?: VendorSeller | undefined },
    Error,
    CreateSellerPayload
  >
) => {
  return useMutation({
    mutationFn: (payload) =>
      api.admin.adminCreateSeller(payload).then((res) => res.data),
    ...options
  })
}
