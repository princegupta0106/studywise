import { db } from '../firebase/config'
import { collection, addDoc } from 'firebase/firestore'

// Function to process CSV data and create courses with folder structure
export async function seedCoursesFromCSV() {
  console.log('🌱 Processing CSV data to create courses with folder structure...')
  
  // Sample CSV data processed into course structure
  // This would normally be read from your CSV file
  const csvData = [
    // Example entries - you would replace this with actual CSV parsing
    {
      fileName: "Exp6.pdf",
      fileUrl: "https://drive.google.com/file/d/1DF9Hv7aXCc43Jb5LggqqrSLSM90PB6wb/view?usp=drivesdk",
      path: "studywise_drive/Chemistry Lab CHEM F110/Readings and Manual/Exp6.pdf"
    },
    // ... more entries would be here
  ]
  
  // Process the CSV data and group by course and folder
  const coursesData = processCSVData(csvData)
  
  // Create courses in Firestore
  const createdCourses = []
  for (const courseData of coursesData) {
    try {
      const courseRef = await addDoc(collection(db, 'courses'), {
        ...courseData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      createdCourses.push({
        id: courseRef.id,
        name: courseData.name
      })
      
      console.log(`✅ Created course: ${courseData.name} (${courseRef.id})`)
    } catch (error) {
      console.error(`❌ Error creating course ${courseData.name}:`, error)
    }
  }
  
  console.log(`🎉 Successfully created ${createdCourses.length} courses!`)
  return createdCourses
}

// Helper function to process CSV data into course structure
function processCSVData(csvData) {
  const coursesMap = new Map()
  
  csvData.forEach(row => {
    const pathParts = row.path.split('/')
    if (pathParts.length < 3) return // Skip invalid paths
    
    // Extract course name (second part after studywise_drive)
    const courseName = pathParts[1]
    if (!courseName || courseName === 'studywise_drive') return
    
    // Extract folder name (third part)
    const folderName = pathParts[2]
    if (!folderName) return
    
    // Initialize course if not exists
    if (!coursesMap.has(courseName)) {
      coursesMap.set(courseName, {
        name: courseName,
        description: generateCourseDescription(courseName),
        items: [], // Regular items (can be empty or add some sample items)
        folder_items: []
      })
    }
    
    const course = coursesMap.get(courseName)
    
    // Find or create folder
    let folder = course.folder_items.find(f => f.folder_name === folderName)
    if (!folder) {
      folder = {
        folder_name: folderName,
        files: []
      }
      course.folder_items.push(folder)
    }
    
    // Add file to folder
    folder.files.push({
      file_name: row.fileName,
      file_url: row.fileUrl
    })
  })
  
  return Array.from(coursesMap.values())
}

// Helper function to generate course descriptions
function generateCourseDescription(courseName) {
  const descriptions = {
    'Chemistry Lab CHEM F110': 'Hands-on chemistry laboratory course covering fundamental experiments and techniques in general chemistry.',
    'Physics Lab PHY F110': 'Experimental physics laboratory covering mechanics, optics, electricity, and modern physics experiments.',
    'Mathematics 2 MATH F112': 'Advanced mathematics course covering linear algebra, differential equations, and mathematical analysis.',
    'Probabilitya and Statistics MATH F113': 'Comprehensive course in probability theory, statistical methods, and data analysis.',
    'Oscillations and Waves PHY F101': 'Study of oscillatory motion, wave phenomena, and their applications in physics.',
    'Engineering Graphics BITS F110': 'Technical drawing and computer-aided design fundamentals for engineering applications.',
    'Technical Report Writing BITS F112': 'Academic and technical writing skills with emphasis on research methodology and report preparation.',
    'Workshop Practice ME F112': 'Practical engineering workshop training covering manufacturing processes and material science.',
    'Thermodynamics BITS F111': 'Fundamental principles of thermodynamics, heat transfer, and energy conversion systems.'
  }
  
  return descriptions[courseName] || `Comprehensive course covering ${courseName.toLowerCase()} concepts and applications.`
}

// Function to seed with actual CSV data (you would call this with your CSV content)
export async function seedFromActualCSV(csvContent) {
  console.log('📊 Processing actual CSV data...')
  
  // Parse CSV content (you might want to use a CSV parsing library)
  const lines = csvContent.split('\n')
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
  
  const csvData = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue
    
    // Simple CSV parsing (you might want to use a proper CSV parser for complex cases)
    const values = line.split(',').map(v => v.replace(/"/g, '').trim())
    if (values.length >= 3) {
      csvData.push({
        fileName: values[0],
        fileUrl: values[1],
        path: values[2]
      })
    }
  }
  
  console.log(`📝 Parsed ${csvData.length} entries from CSV`)
  
  // Process and create courses
  const coursesData = processCSVData(csvData)
  console.log(`🏫 Found ${coursesData.length} unique courses`)
  
  // Log course summary
  coursesData.forEach(course => {
    const totalFiles = course.folder_items.reduce((sum, folder) => sum + folder.files.length, 0)
    console.log(`📚 ${course.name}: ${course.folder_items.length} folders, ${totalFiles} files`)
  })
  
  // Create courses in Firestore
  const createdCourses = []
  for (const courseData of coursesData) {
    try {
      const courseRef = await addDoc(collection(db, 'courses'), {
        ...courseData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      
      createdCourses.push({
        id: courseRef.id,
        name: courseData.name,
        folders: courseData.folder_items.length,
        files: courseData.folder_items.reduce((sum, folder) => sum + folder.files.length, 0)
      })
      
      console.log(`✅ Created course: ${courseData.name} (ID: ${courseRef.id})`)
    } catch (error) {
      console.error(`❌ Error creating course ${courseData.name}:`, error)
    }
  }
  
  return createdCourses
}