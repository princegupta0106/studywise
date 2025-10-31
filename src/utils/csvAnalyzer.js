// Quick test script to analyze CSV data structure
// Run this in browser console to see what courses will be created

export function analyzeCSVData(csvText) {
  console.log('📊 Analyzing CSV data...')
  
  const lines = csvText.split('\n')
  const csvData = []
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    const values = line.split(',').map(v => v.replace(/"/g, '').trim())
    if (values.length >= 3) {
      csvData.push({
        fileName: values[0],
        fileUrl: values[1],
        path: values[2]
      })
    }
  }
  
  console.log(`📝 Total entries: ${csvData.length}`)
  
  // Group by course
  const coursesMap = new Map()
  
  csvData.forEach(row => {
    const pathParts = row.path.split('/')
    if (pathParts.length < 3) return
    
    const courseName = pathParts[1]
    if (!courseName || courseName === 'studywise_drive') return
    
    const folderName = pathParts[2]
    if (!folderName) return
    
    if (!coursesMap.has(courseName)) {
      coursesMap.set(courseName, new Map())
    }
    
    const folders = coursesMap.get(courseName)
    if (!folders.has(folderName)) {
      folders.set(folderName, [])
    }
    
    folders.get(folderName).push(row.fileName)
  })
  
  console.log(`🏫 Found ${coursesMap.size} unique courses:`)
  
  const analysis = []
  for (const [courseName, folders] of coursesMap.entries()) {
    const totalFiles = Array.from(folders.values()).reduce((sum, files) => sum + files.length, 0)
    const courseInfo = {
      name: courseName,
      folders: folders.size,
      totalFiles: totalFiles,
      folderDetails: Object.fromEntries(
        Array.from(folders.entries()).map(([folder, files]) => [folder, files.length])
      )
    }
    analysis.push(courseInfo)
    
    console.log(`📚 ${courseName}:`)
    console.log(`   • ${folders.size} folders, ${totalFiles} total files`)
    for (const [folderName, files] of folders.entries()) {
      console.log(`   • ${folderName}: ${files.length} files`)
    }
    console.log('') // Empty line for readability
  }
  
  return analysis
}

// Test with sample data
export function testCSVParsing() {
  const sampleCSV = `"Name","URL","Path"
"Exp6.pdf","https://drive.google.com/file/d/1DF9Hv7aXCc43Jb5LggqqrSLSM90PB6wb/view?usp=drivesdk","studywise_drive/Chemistry Lab CHEM F110/Readings and Manual/Exp6.pdf"
"Exp7.pdf","https://drive.google.com/file/d/1DHaF2bxCd43Jb5LggqqrSLSM90PB6wb/view?usp=drivesdk","studywise_drive/Chemistry Lab CHEM F110/Readings and Manual/Exp7.pdf"
"lecture1.pdf","https://drive.google.com/file/d/1test123456789/view?usp=drivesdk","studywise_drive/Physics Lab PHY F110/Lecture Slides/lecture1.pdf"`
  
  return analyzeCSVData(sampleCSV)
}