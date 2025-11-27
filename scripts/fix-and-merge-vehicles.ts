// @ts-nocheck
import * as fs from 'fs'
import * as path from 'path'

const dataFilePath = path.join(process.cwd(), 'data', 'vehicles-data.json')

async function fixAndMerge() {
  console.log('Reading vehicles-data.json...')
  const content = fs.readFileSync(dataFilePath, 'utf-8')
  
  // Check for split arrays
  const hasSplit = /\]\s*\[/.test(content)
  
  if (hasSplit) {
    console.log('Found split arrays - merging...')
    const parts = content.split(/\]\s*\[/)
    
    if (parts.length === 2) {
      const first = parts[0] + ']'
      const second = '[' + parts[1]
      
      try {
        const firstData = JSON.parse(first)
        const secondData = JSON.parse(second)
        
        console.log(`First array: ${firstData.length} vehicles`)
        console.log(`Second array: ${secondData.length} vehicles`)
        
        // Merge arrays
        const merged = [...firstData, ...secondData]
        
        // Fix "torque Nm" typos
        let fixed = JSON.stringify(merged, null, 2)
        const beforeFix = fixed
        fixed = fixed.replace(/"torque Nm":/g, '"torqueNm":')
        const fixedCount = (beforeFix.match(/"torque Nm":/g) || []).length
        
        if (fixedCount > 0) {
          console.log(`Fixed ${fixedCount} "torque Nm" typos`)
        }
        
        // Create backup
        const backupPath = dataFilePath.replace('.json', `.backup.${Date.now()}.json`)
        fs.writeFileSync(backupPath, content, 'utf-8')
        console.log(`Backup created: ${backupPath}`)
        
        // Write merged and fixed data
        fs.writeFileSync(dataFilePath, fixed, 'utf-8')
        
        console.log(`\n✅ Successfully merged arrays!`)
        console.log(`   Total vehicles: ${merged.length}`)
        console.log(`   First array: ${firstData.length}`)
        console.log(`   Second array: ${secondData.length}`)
        
        return merged.length
      } catch (error) {
        console.error('Error parsing arrays:', error instanceof Error ? error.message : error)
        return null
      }
    }
  } else {
    // No split, but check for "torque Nm" typos
    try {
      const data = JSON.parse(content)
      let fixed = JSON.stringify(data, null, 2)
      const beforeFix = fixed
      fixed = fixed.replace(/"torque Nm":/g, '"torqueNm":')
      const fixedCount = (beforeFix.match(/"torque Nm":/g) || []).length
      
      if (fixedCount > 0) {
        const backupPath = dataFilePath.replace('.json', `.backup.${Date.now()}.json`)
        fs.writeFileSync(backupPath, content, 'utf-8')
        fs.writeFileSync(dataFilePath, fixed, 'utf-8')
        console.log(`✅ Fixed ${fixedCount} "torque Nm" typos`)
        return data.length
      } else {
        console.log('✅ No issues found - file is valid')
        return data.length
      }
    } catch (error) {
      console.error('Error parsing JSON:', error instanceof Error ? error.message : error)
      return null
    }
  }
}

fixAndMerge().then((count) => {
  if (count !== null) {
    console.log(`\n📊 File now contains ${count} vehicles`)
    console.log('Next step: Run npx tsx scripts/run-cron.ts to sync to database')
  }
  process.exit(count !== null ? 0 : 1)
})

