/**
 * Simple seed helper for local development - NEW STRUCTURE
 * WARNING: run only in development and with your own Firebase project.
 * Usage: import and call seed() from a dev-only page or node environment with credentials.
 */
import { db } from './config'
import { doc, setDoc, collection, addDoc } from 'firebase/firestore'

export async function seed() {
  console.log('Creating courses with new structure...')

  // Create sample courses using the new structure with direct items
  const course1 = await addDoc(collection(db, 'courses'), {
    name: 'Data Structures & Algorithms',
    description: 'Complete DSA course with theory and practice',
    items: [
      {
        name: 'Introduction to Arrays',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        category: 'videos'
      },
      {
        name: 'Array Operations Guide',
        url: 'https://drive.google.com/file/d/1D28tMvsflFcErafpuN_V5caONXOUQ0L9/view',
        category: 'guide'
      },
      {
        name: 'Array PYQ 2023',
        url: 'https://drive.google.com/file/d/1D28tMvsflFcErafpuN_V5caONXOUQ0L9/view',
        category: 'PYQs and Solutions'
      },
      {
        name: 'BITS Library - DSA Book',
        url: 'https://library.bits-pilani.ac.in/dsa-resources',
        category: 'bits library'
      },
      {
        name: 'Extra Notes PDF',
        url: 'https://drive.google.com/file/d/1D28tMvsflFcErafpuN_V5caONXOUQ0L9/view',
        category: 'others'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const course2 = await addDoc(collection(db, 'courses'), {
    name: 'Web Development',
    description: 'Full stack web development with React and Node.js',
    items: [
      {
        name: 'React Basics Video',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        category: 'videos'
      },
      {
        name: 'React Tutorial Guide',
        url: 'https://react.dev/learn',
        category: 'guide'
      },
      {
        name: 'Web Dev PYQ 2022',
        url: 'https://drive.google.com/file/d/1D28tMvsflFcErafpuN_V5caONXOUQ0L9/view',
        category: 'PYQs and Solutions'
      },
      {
        name: 'JavaScript Reference',
        url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',
        category: 'bits library'
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  const course3 = await addDoc(collection(db, 'courses'), {
  "name": "Full-Stack Web Development Bootcamp",
  "description": "A comprehensive 12-week course covering modern frontend and backend development with Node.js and React.",
  
  // 1. Regular course items (ungrouped files)
  "items": [
    {
      "file_name": "Syllabus and Schedule.pdf",
      "file_url": "https://coursefiles.com/main/syllabus.pdf"
    },
    {
      "file_name": "Final Project Guidelines.docx",
      "file_url": "https://coursefiles.com/main/project-guide.docx"
    }
  ],
  
  // 2. Organized folders of items
  "folder_items": [
    {
      "folder_name": "Module 1: HTML & CSS Fundamentals",
      "files": [
        {
          "file_name": "CSS Grid Layout.pdf",
          "file_url": "https://coursefiles.com/m1/css-grid-layout.pdf"
        },
        {
          "file_name": "Flexbox Video Tutorial.mp4",
          "file_url": "https://coursefiles.com/m1/flexbox-video.mp4"
        }
      ]
    },
    {
      "folder_name": "Module 2: Advanced JavaScript Concepts",
      "files": [
        {
          "file_name": "Async-Await Deep Dive.pdf",
          "file_url": "https://coursefiles.com/m2/async-await-deep-dive.pdf"
        },
        {
          "file_name": "Promises and Callbacks.mp4",
          "file_url": "https://coursefiles.com/m2/promises-and-callbacks-video.mp4"
        },
        {
          "file_name": "Generators & Iterators Quiz.json",
          "file_url": "https://coursefiles.com/m2/quiz-data.json"
        }
      ]
    },
    {
      "folder_name": "Module 3: Server-Side with Node.js",
      "files": [
        {
          "file_name": "Express Routing Cheatsheet.pdf",
          "file_url": "https://coursefiles.com/m3/express-routing-cheatsheet.pdf"
        }
      ]
    }
  ]
})

  // Create a sample user and enroll them in courses
  const userRef = doc(db, 'users', 'dev-user')
  await setDoc(userRef, {
    name: 'Dev User',
    email: 'dev@example.com',
    courses: [course1.id, course2.id]
  })

  console.log('Sample courses created successfully!')

  // Create a course with folder structure (like your example)
  const course4 = await addDoc(collection(db, 'courses'), {
    name: 'Full-Stack Web Development Bootcamp',
    description: 'A comprehensive 12-week course covering modern frontend and backend development with Node.js and React.',
    items: [
      {
        category: 'videos',
        file_name: 'Final Project Guidelines.docx',
        file_url: 'https://coursefiles.com/main/project-guide.docx'
      },
      {
        category: 'file'
      },
      {
        category: 'fds'
      }
    ],
    folder_items: [
      {
        folder_name: 'Module 1: HTML & CSS Fundamentals',
        files: [
          {
            file_url: 'https://coursefiles.com/m1/css-grid-layout.pdf',
            file_name: 'CSS Grid Layout.pdf'
          },
          {
            file_name: 'Flexbox Video Tutorial.mp4',
            file_url: 'https://coursefiles.com/m1/flexbox-video.mp4'
          }
        ]
      },
      {
        folder_name: 'Module 2: Advanced JavaScript Concepts',
        files: [
          {
            file_url: 'https://coursefiles.com/m2/async-await-deep-dive.pdf',
            file_name: 'Async-Await Deep Dive.pdf'
          },
          {
            file_name: 'Promises and Callbacks.mp4',
            file_url: 'https://coursefiles.com/m2/promises-and-callbacks-video.mp4'
          },
          {
            file_name: 'Generators & Iterators Quiz.json',
            file_url: 'https://coursefiles.com/m2/quiz-data.json'
          }
        ]
      },
      {
        folder_name: 'Module 3: Server-Side with Node.js',
        files: [
          {
            file_name: 'Express Routing Cheatsheet.pdf',
            file_url: 'https://coursefiles.com/m3/express-routing-cheatsheet.pdf'
          }
        ]
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })

  // Return created course ids
  return {
    courseIds: [course1.id, course2.id, course3.id, course4.id],
    course1Id: course1.id,
    course2Id: course2.id,
    course3Id: course3.id,
    course4Id: course4.id
  }
}
