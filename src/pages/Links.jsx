import React from 'react'

const Links = () => {
  const links = [
    { id: 1, name: 'BITS Library Koha (Book Search)', url: 'https://bitspilani-opac.kohacloud.in/' },
    { id: 2, name: 'AUGSD / AGSR Website', url: 'https://academic.bits-pilani.ac.in/' },
    { id: 9, name: 'SWD Website', url: 'https://swd.bits-pilani.ac.in/' },
    { id: 3, name: 'Nalanda (Learning Management)', url: 'https://nalanda-aws.bits-pilani.ac.in/' },
    { id: 4, name: 'Library Website', url: 'https://library.bits-pilani.ac.in/' },
    { id: 5, name: 'ERP Portal', url: 'https://erp.bits-pilani.ac.in/' },
    { id: 6, name: 'All Contacts (Auto, C\'not, Bits)', url: 'https://drive.google.com/drive/folders/1oS4xsbS79Rz80XG8ZOtSTD218O2gco9w' },
    { id: 7, name: 'Padho BC WhatsApp Group', url: 'https://chat.whatsapp.com/EtwxqqtYMmw9eBQ1RTv4sJ?mode=wwt' },
    { id: 8, name: 'BITS WhatsApp Groups', url: 'https://docs.google.com/document/d/1tL7zCeyH2yUat_2_ICBjpvXb4bSNrlwRgCtVupe57hg/edit?usp=sharing' },
    
  ]

  const handleLinkClick = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  // Define subtle color variations - blue and purple tones only
  const getColorClass = (index) => {
    const colors = [
      'bg-[rgba(59,130,246,0.08)] hover:bg-[rgba(59,130,246,0.15)] border border-blue-600/20', // Blue
      'bg-[rgba(168,85,247,0.08)] hover:bg-[rgba(168,85,247,0.15)] border border-purple-600/20', // Purple
      'bg-[rgba(99,102,241,0.08)] hover:bg-[rgba(99,102,241,0.15)] border border-indigo-600/20', // Indigo
      'bg-[rgba(139,92,246,0.08)] hover:bg-[rgba(139,92,246,0.15)] border border-violet-600/20', // Violet
    ]
    return colors[index % colors.length]
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6">Important Links</h2>
      
      <div className="space-y-3">
        {links.map((link, index) => (
          <button
            key={link.id}
            onClick={() => handleLinkClick(link.url)}
            className={`w-full py-3 px-4 ${getColorClass(index)} rounded-sm text-left text-white text-sm font-medium transition-colors duration-200 flex items-center`}
          >
            {link.name}
          </button>
        ))}
      </div>
    </div>
  )
}

export default Links