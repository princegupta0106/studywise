// Sample Course Data Structure for Files & Documents Feature
// This shows how the course object should be structured to work with the FilesDocuments component

const sampleCourse = {
  name: "Sample Course Name",
  description: "Course description here",
  items: [
    // Regular course items array
  ],
  folder_items: [
    {
      folder_name: "Slides",
      files: [
        {
          file_name: "Lecture 1 - Introduction.pdf",
          file_url: "https://example.com/files/lecture1.pdf"
        },
        {
          file_name: "Lecture 2 - Advanced Topics.pptx", 
          file_url: "https://example.com/files/lecture2.pptx"
        }
      ]
    },
    {
      folder_name: "Handouts",
      files: [
        {
          file_name: "Assignment 1.docx",
          file_url: "https://example.com/files/assignment1.docx"
        },
        {
          file_name: "Reference Material.pdf",
          file_url: "https://example.com/files/reference.pdf"
        }
      ]
    },
    {
      folder_name: "Previous Year Papers", 
      files: [
        {
          file_name: "2023 Final Exam.pdf",
          file_url: "https://example.com/files/2023-final.pdf"
        },
        {
          file_name: "2023 Mid Term.pdf", 
          file_url: "https://example.com/files/2023-midterm.pdf"
        },
        {
          file_name: "2024 Final Exam.pdf",
          file_url: "https://example.com/files/2024-final.pdf"
        }
      ]
    }
  ]
}

// Features of the FilesDocuments component:
// 1. Shows all folders as collapsible cards
// 2. Only one folder can be expanded at a time (accordion behavior)
// 3. Files are displayed in a responsive grid layout
// 4. Different file type icons based on file extension (PDF, DOC, XLS, PPT, TXT)
// 5. Smooth animations for expand/collapse
// 6. Hover effects and scaling for better UX
// 7. Shows total folder and file counts in header
// 8. All files open in new tab when clicked
// 9. Responsive design that works on mobile and desktop