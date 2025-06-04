import { setAuthAppMetadataStep } from '@medusajs/medusa/core-flows'
import { WorkflowResponse, createWorkflow } from '@medusajs/workflows-sdk'

type SetAuthMetadataWorkflowInput = {
  authIdentityId: string
  actorType: string
  value: string | number
}

export const setAuthMetadataWorkflow = createWorkflow(
  'set-auth-metadata',
  function (input: SetAuthMetadataWorkflowInput) {
    setAuthAppMetadataStep({
      authIdentityId: input.authIdentityId,
      actorType: input.actorType,
      value: input.value
    })

    return new WorkflowResponse({
      success: true,
      authIdentityId: input.authIdentityId,
      actorType: input.actorType,
      value: input.value
    })
  }
)
