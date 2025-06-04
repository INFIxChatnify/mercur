import axios from 'axios'
import crypto from 'crypto'

import { container } from '@medusajs/framework'
import {
  AuthIdentityProviderService,
  AuthenticationInput,
  AuthenticationResponse,
  Logger
} from '@medusajs/framework/types'
import {
  AbstractAuthModuleProvider,
  MedusaError,
  toHandle
} from '@medusajs/framework/utils'
import { transform } from '@medusajs/framework/workflows-sdk'

import { OAUTH2_URL } from '../../lib/constants'
import { setAuthMetadataWorkflow } from '../../workflows/auth/workflows'
import { createSellerStep } from '../../workflows/seller/steps/create-seller'
import { REQUESTS_MODULE } from '../requests'
import RequestsModuleService from '../requests/service'
import { SELLER_MODULE } from '../seller'
import SellerModuleService from '../seller/service'
import { CreateMemberDTO, MemberDTO, SellerDTO } from '../seller/types'

type InjectedDependencies = {
  logger: Logger
}

type Options = {
  callbackUrl: string
  clientId: string
}

type TokenResponse = {
  access_token: string
  expires_in: number
  token_type: string
  scope: string
  refresh_token: string
}

// interface MyAuthProviderService extends GoogleAuthProviderOptions {}
class MyAuthProviderService extends AbstractAuthModuleProvider {
  static identifier = 'my-auth'
  static DISPLAY_NAME = 'My Auth'

  //   protected config_: MyAuthProviderService;
  protected logger_: Logger
  //   protected options_: Options;
  protected config_: Options

  static validateOptions(options: Options) {
    if (!options.clientId) {
      throw new Error('My Auth clientId is required')
    }

    if (!options.callbackUrl) {
      throw new Error('My Auth callbackUrl is required')
    }
  }

  constructor(
    { logger }: InjectedDependencies,
    // options: GoogleAuthProviderOptions,
    options: Options
  ) {
    // @ts-ignore
    super(...arguments)
    this.config_ = options
    this.logger_ = logger
    // this.options_ = options;
  }

  async register(_): Promise<AuthenticationResponse> {
    throw new MedusaError(
      MedusaError.Types.NOT_ALLOWED,
      'Google does not support registration. Use method `authenticate` instead.'
    )
  }

  async authenticate(
    req: AuthenticationInput,
    authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const query: Record<string, string> = req.query ?? {}
    const body: Record<string, string> = req.body ?? {}

    if (query.error) {
      return {
        success: false,
        error: `${query.error_description}, read more at: ${query.error_uri}`
      }
    }

    const stateKey = crypto.randomBytes(32).toString('hex')
    const state = {
      callback_url: body?.callback_url ?? this.config_.callbackUrl
    }

    await authIdentityService.setState(stateKey, state)
    return this.getRedirect(this.config_.clientId, state.callback_url, stateKey)
  }

  async validateCallback(
    req: AuthenticationInput,
    authIdentityService: AuthIdentityProviderService
  ): Promise<AuthenticationResponse> {
    const query: Record<string, string> = req.query ?? {}
    const body: Record<string, string> = req.body ?? {}

    if (query.error) {
      return {
        success: false,
        error: `${query.error_description}, read more at: ${query.error_uri}`
      }
    }

    const code = query?.code ?? body?.code
    if (!code) {
      return { success: false, error: 'No code provided' }
    }

    const state = await authIdentityService.getState(query?.state as string)
    if (!state) {
      return { success: false, error: 'No state provided, or session expired' }
    }

    try {
      const data = {
        code,
        client_id: this.config_.clientId,
        redirect_uri: state.callback_url,
        grant_type: 'authorization_code'
      }

      const response = await axios
        .post(`${OAUTH2_URL}/oauth/authenticate`, data)
        .then((r) => {
          if (!r.status) {
            throw new MedusaError(
              MedusaError.Types.INVALID_DATA,
              `Could not exchange token, ${r.status}, ${r.statusText}`
            )
          }

          return r.data
        })

      const { authIdentity, success } = await this.verify_(
        response as TokenResponse,
        authIdentityService
      )
      console.log(
        'Token Response:',
        authIdentity.provider_identities[0].user_metadata
      )
      console.log('Auth Identity:', authIdentity)
      if (!authIdentity.app_metadata) {
        try {
          const input = {
            seller: {
              name: authIdentity.provider_identities[0].user_metadata.name
            },
            member: {
              name: authIdentity.provider_identities[0].user_metadata.name,
              email: authIdentity.provider_identities[0].user_metadata.email,
              role: 'owner'
            },
            auth_identity_id: authIdentity.id
          }
          // const priceService = container.resolve(Modules.PRICING)
          const service = container.resolve<SellerModuleService>(SELLER_MODULE)

          const seller: SellerDTO = await service.createSellers({
            ...input.seller,
            handle: toHandle(input.seller.name)
          })

          // const onboarding = await service.createSellerOnboardings({
          //   seller_id: seller.id
          // })

          // // const seller = createSellerStep(input.seller)

          // // const memberInput: CreateMemberDTO = transform(
          // //   { seller, member: input.member },
          // //   ({ member, seller }) => ({
          // //     ...member,
          // //     seller_id: seller.id
          // //   })
          // // )
          // const services = container.resolve<SellerModuleService>(SELLER_MODULE)

          // const member: MemberDTO = await services.createMembers({
          //   ...input.member,
          //   seller_id: seller.id
          // })
          // // console.log(memberInput)

          // // Use the workflow to set auth metadata
          // await setAuthMetadataWorkflow.run({
          //   container,
          //   input: {
          //     authIdentityId: input.auth_identity_id,
          //     actorType: 'seller',
          //     value: member.id
          //   }
          // })

          const servicesss =
            container.resolve<RequestsModuleService>(REQUESTS_MODULE)

          // const toCreate = Array.isArray(input) ? input : [input]

          const requests = await servicesss.createRequests({
            data: {
              seller: {
                name: authIdentity.provider_identities[0].user_metadata.name
              },
              member: input.member,
              auth_identity_id:
                authIdentity.provider_identities[0].auth_identity_id,
              provider_identity_id:
                authIdentity.provider_identities[0].entity_id
            },
            type: 'seller',
            submitter_id: authIdentity.provider_identities[0].id
          })

          //  await createSellerCreationRequestWorkflow.run({
          //     input: {
          //       data: {
          //         seller: sellerData,
          //         member,
          //         auth_identity_id: req.auth_context?.auth_identity_id,
          //         provider_identity_id: identity.entity_id
          //       },
          //       type: 'seller',
          //       submitter_id: identity.id
          //     },
          //     container: req.scope
          //   })
          // Use the workflow to create the seller and member
          // const { result: seller } = await createSellerWorkflow.run({
          //   // container: req.scope,

          // })
          console.log('Seller created:', seller)
        } catch (error) {
          console.log('Error creating seller in workflow:', error)
        }
      }

      return {
        success,
        authIdentity
      }
    } catch (error) {
      console.log('Error in validateCallback:', error)
      return { success: false, error: error.message }
    }
  }

  async verify_(
    Token: TokenResponse | undefined,
    authIdentityService: AuthIdentityProviderService
  ) {
    if (!Token) {
      return { success: false, error: 'No ID found' }
    }

    const response = await axios
      .get(`${OAUTH2_URL}/oauth/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `${Token.token_type} ${Token.access_token}`
        }
      })
      .then((r) => {
        if (!r.status) {
          throw new MedusaError(
            MedusaError.Types.INVALID_DATA,
            `Could not get current user, ${r.status}, ${r.statusText}`
          )
        }

        return r.data
      })

    const payload = response // Assuming response contains user data
    const userMetadata = {
      name: payload.name,
      email: payload.email,
      picture: payload.avatar_url,
      given_name: `${payload.firstname} ${payload.lastname}`,
      family_name: '-',
      wallet: payload.wallet
    }

    let authIdentity

    try {
      authIdentity = await authIdentityService.retrieve({
        entity_id: payload.id
      })
    } catch (error) {
      if (error.type === MedusaError.Types.NOT_FOUND) {
        const createdAuthIdentity = await authIdentityService.create({
          entity_id: payload.id,
          user_metadata: userMetadata
        })
        authIdentity = createdAuthIdentity
      } else {
        return { success: false, error: error.message }
      }
    }

    return {
      success: true,
      authIdentity
    }
  }

  private getRedirect(clientId: string, callbackUrl: string, stateKey: string) {
    const authUrl = new URL(`${OAUTH2_URL}/oauth/authorize`)
    authUrl.searchParams.set('redirect_uri', callbackUrl)
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set(
      'scope',
      'basic email photo profile profiles wallet'
    )
    authUrl.searchParams.set('state', stateKey)

    return { success: true, location: authUrl.toString() }
  }
}

export default MyAuthProviderService
