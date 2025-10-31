import { seedFromActualCSV } from './csvSeedFirestore'
import csvContent from '../assets/file_urls (1).csv?raw'

export async function seedFromExistingCSV() {
  console.log('🚀 Starting to seed from existing CSV file...')
  
  try {
    const createdCourses = await seedFromActualCSV(csvContent)
    console.log('🎉 CSV seeding completed successfully!')
    return createdCourses
  } catch (error) {
    console.error('❌ Error during CSV seeding:', error)
    throw error
  }
}