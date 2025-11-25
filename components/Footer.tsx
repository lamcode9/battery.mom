import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">EVCompare SEA</h3>
            <p className="text-sm">
              Compare electric vehicles available in Singapore and Malaysia. 
              Make informed decisions with comprehensive EV data.
            </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Data Sources</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://ev-database.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  EV Database
                </a>
              </li>
              <li>
                <a
                  href="https://sgcarmart.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  SGCarMart
                </a>
              </li>
              <li>
                <a
                  href="https://carlist.my"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Carlist.my
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm">
          <p>
            © {new Date().getFullYear()} EVCompare SEA. All rights reserved.
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Prices and specifications are estimates. Always consult official dealers for current information.
          </p>
        </div>
      </div>
    </footer>
  )
}

