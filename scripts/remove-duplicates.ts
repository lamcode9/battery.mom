// @ts-nocheck
import * as fs from 'fs'
import * as path from 'path'

const dataFilePath = path.join(process.cwd(), 'data', 'vehicles-data.json')

async function removeDuplicates() {
  console.log('Reading vehicles-data.json...')
  const content = fs.readFileSync(dataFilePath, 'utf-8')
  const vehicles = JSON.parse(content)
  
  console.log(`Original count: ${vehicles.length} vehicles`)
  
  // Track seen vehicles by key: name|trim|country
  const seen = new Map()
  const unique = []
  const duplicates = []
  
  vehicles.forEach((vehicle, index) => {
    const trim = vehicle.modelTrim || 'base'
    const key = `${vehicle.name}|${trim}|${vehicle.country}`
    
    if (seen.has(key)) {
      duplicates.push({
        index,
        key,
        vehicle: `${vehicle.name} ${trim} (${vehicle.country})`,
        originalIndex: seen.get(key)
      })
    } else {
      seen.set(key, unique.length)
      unique.push(vehicle)
    }
  })
  
  if (duplicates.length > 0) {
    console.log(`\n⚠️  Found ${duplicates.length} duplicate entries:`)
    duplicates.forEach(dup => {
      console.log(`  - Index ${dup.index}: ${dup.vehicle}`)
    })
    
    // Create backup
    const backupPath = dataFilePath.replace('.json', `.backup.${Date.now()}.json`)
    fs.writeFileSync(backupPath, content, 'utf-8')
    console.log(`\nBackup created: ${backupPath}`)
    
    // Write unique vehicles
    fs.writeFileSync(dataFilePath, JSON.stringify(unique, null, 2), 'utf-8')
    
    console.log(`\n✅ Removed ${duplicates.length} duplicates`)
    console.log(`   Original: ${vehicles.length} vehicles`)
    console.log(`   Unique: ${unique.length} vehicles`)
  } else {
    console.log('✅ No duplicates found')
  }
  
  return unique.length
}

removeDuplicates().then((count) => {
  console.log(`\n📊 File now contains ${count} unique vehicles`)
  process.exit(0)
}).catch((error) => {
  console.error('Error:', error)
  process.exit(1)
})

