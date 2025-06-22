import { loadEnv } from '@medusajs/framework/utils'
import { MikroORM } from '@mikro-orm/postgresql'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

async function checkDuplicateMedia() {
  const orm = await MikroORM.init({
    entities: ['./dist/modules/**/models/*.js'],
    entitiesTs: ['./src/modules/**/models/*.ts'],
    clientUrl: process.env.DATABASE_URL,
    type: 'postgresql',
  })
  
  try {
    const query = container.resolve('query')
    
    // Get all digital product media records
    const { data: allMedias } = await query.graph({
      entity: 'digital_product_media',
      fields: ['*'],
      filters: {
        deleted_at: null
      }
    })
    
    console.log(`Total media records: ${allMedias.length}`)
    
    // Group by digital_product_id and fileId to find duplicates
    const mediaGroups = allMedias.reduce((acc, media) => {
      const key = `${media.digital_product_id}-${media.fileId}-${media.type}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(media)
      return acc
    }, {} as Record<string, any[]>)
    
    // Find duplicates
    const duplicates = Object.entries(mediaGroups).filter(([_, medias]) => medias.length > 1)
    
    if (duplicates.length > 0) {
      console.log(`\nFound ${duplicates.length} duplicate groups:`)
      duplicates.forEach(([key, medias]) => {
        console.log(`\nDuplicate group: ${key}`)
        console.log(`Number of duplicates: ${medias.length}`)
        medias.forEach(media => {
          console.log(`  - ID: ${media.id}, Created: ${media.created_at}`)
        })
      })
    } else {
      console.log('\nNo duplicates found')
    }
    
    // Check recent records
    console.log('\n--- Recent Media Records (last 10) ---')
    const recentMedias = allMedias
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 10)
    
    recentMedias.forEach(media => {
      console.log(`ID: ${media.id}`)
      console.log(`Digital Product ID: ${media.digital_product_id}`)
      console.log(`File ID: ${media.fileId}`)
      console.log(`Type: ${media.type}`)
      console.log(`Created: ${media.created_at}`)
      console.log('---')
    })
    
  } catch (error) {
    console.error('Error checking duplicates:', error)
  } finally {
    await container.close()
  }
}

checkDuplicateMedia()