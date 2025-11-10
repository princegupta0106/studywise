import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCourse } from '../firebase/api'

export default function FilesDocuments() {
  const { courseId } = useParams()
  const [course, setCourse] = useState(null)
  const [expandedFolder, setExpandedFolder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const courseData = await getCourse(courseId)
        if (mounted) {
          setCourse(courseData)
          setLoading(false)
        }
      } catch (error) {
        console.error('Error loading course:', error)
        if (mounted) {
          setCourse(null)
          setLoading(false)
        }
      }
    }
    load()
    return () => { mounted = false }
  }, [courseId])

  const handleFolderClick = (folderName) => {
    // Toggle folder - if it's already expanded, collapse it, otherwise expand it
    setExpandedFolder(expandedFolder === folderName ? null : folderName)
  }

  // Helper function to get file extension icon
  const getFileIcon = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase()
    
    switch (extension) {
      case 'pdf':
        return (
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
          </svg>
        )
      case 'doc':
      case 'docx':
        return (
          <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        )
      case 'xls':
      case 'xlsx':
        return (
          <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        )
      case 'ppt':
      case 'pptx':
        return (
          <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        )
      case 'txt':
        return (
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      default:
        return (
          <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  if (loading) return <div>Loading Files & Documents...</div>
  if (!course) return <div>Course not found</div>

  const folderItems = course.folder_items || []
  const totalFiles = folderItems.reduce((total, folder) => total + (folder.files?.length || 0), 0)

  return (
    <div>
      <div className="mb-4">
        <Link to={`/course/${courseId}`} className="text-yellow-500 hover:text-warning text-sm transition-colors">
          ← Back to {course?.name || 'Course'}
        </Link>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-2" style={{color: '#c7c7c7'}}>Files & Documents</h2>
        {/* <p className="text-gray-400 text-lg">
          {folderItems.length} folder{folderItems.length !== 1 ? 's' : ''} • {totalFiles} file{totalFiles !== 1 ? 's' : ''}
        </p> */}
      </div>

      {folderItems.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No folders available yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {folderItems.map((folder, index) => (
            <div key={index} className=" rounded-lg border border-transparent overflow-hidden">
              <button
                onClick={() => handleFolderClick(folder.folder_name)}
                className="w-full px-6 py-4 text-left hover:bg-gray-700/10 transition-all duration-200 flex items-center justify-between"
              >
                <div className="flex items-center">
                  <div className="mr-3">
                    <svg 
                      className="w-6 h-6 text-yellow-500" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-medium text-lg" style={{color: '#c7c7c7'}}>{folder.folder_name}</h3>
                    <p className="text-gray-400 text-sm">{folder.files?.length || 0} files</p>
                  </div>
                </div>
                <div className="ml-4">
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                      expandedFolder === folder.folder_name ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Folder Contents */}
              <div 
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  expandedFolder === folder.folder_name 
                    ? 'max-h-screen opacity-100' 
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-4 border-t border-white/10">
                  {folder.files && folder.files.length > 0 ? (
                    <div className="mt-4">
                      {folder.files.length > 9 && (
                        <div className="mb-3 text-sm text-gray-400 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-1" />
                          </svg>
                          {folder.files.length} files • Scroll to view all
                        </div>
                      )}
                      <div className="files-grid gap-4">
                        {folder.files.map((file, fileIndex) => (
                          <a
                            key={fileIndex}
                            href={file.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block bg-white/5 hover:bg-white/15 rounded-lg p-4 transition-all duration-200 border border-white/10 hover:border-white/10   transform hover:scale-102"
                          >
                            <div className="flex items-start">
                              <div className="mr-3 mt-1">
                                {getFileIcon(file.file_name)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-base mb-2 mt-1 truncate" style={{color: '#c7c7c7'}} title={file.file_name}>
                                  {file.file_name || 'Untitled File'}
                                </h4>
                                <p className="text-yellow-500 text-xs font-medium">
                                  Open File →
                                </p>
                              </div>
                            </div>
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-center py-6 text-gray-500">
                      <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm">No files in this folder</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}