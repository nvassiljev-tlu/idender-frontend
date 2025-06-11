'use client';

import { useRouter } from 'next/navigation';

export default function IdenderDashboard() {
  const router = useRouter();

  const handleLogout = () => {
    //logout logic here
    router.push('/loginpage');
  };

  const handleCreateIdea = () => {
    router.push('/ideapage'); // go to idea page
  };

  // mock data - replace with actual data fetching
  const ideas = [
    { id: 1, title: 'More sustainable waste management for our school', author: 'John D.' },
    { id: 2, title: 'We should have a school cafeteria again!', author: 'Justin K.' },
    { id: 3, title: 'We should not bring back the school cafeteria', author: 'Mel N.' },
    { id: 4, title: 'The school should involve students in desicionmaking more via...', author: 'Tõnu T.' }
  ];

  const news = [
    { id: 1, title: 'Student wins Sudoku award', date: 'May 15, 2025' },
    { id: 2, title: 'Proposed idea to "shut down the cafeteria" has been approved by the school board', date: 'May 25, 2025' },
    { id: 3, title: 'School cafeteria permanently shut down', date: 'June 1, 2025' },
    { id: 4, title: 'Malnourishment in Tallinn French Lyceum hit record levels', date: 'June 2, 2025'}
  ];

  // SVG icons from online
  const LogoutIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  );

  const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  );

  const LightbulbIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
      <path d="M9 18h6"/>
      <path d="M10 22h4"/>
    </svg>
  );

  const NewspaperIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/>
      <path d="M18 14h-8"/>
      <path d="M15 18h-5"/>
      <path d="M10 6h8v4h-8V6Z"/>
    </svg>
  );

  const PlusIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );

return (
    <div className="min-h-screen bg-slate-100 text-slate-800 flex flex-col">
      {/* header */}
      <header className="bg-slate-800 text-white p-4 flex justify-between items-center sticky top-0 z-10">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 hover:text-slate-300 transition-colors"
          aria-label="Logout"
        >
          <LogoutIcon />
          <span className="hidden sm:inline">Logout</span>
        </button>
        
        <h1 className="text-xl font-bold">Idender</h1>
        
        <button className="p-1 rounded-full hover:bg-slate-700 transition-colors">
          <UserIcon aria-label="Profile" />
        </button>
      </header>

      {/* main content */}
      <main className="container mx-auto p-4 flex-1 overflow-y-auto">
        {/* ideas section */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <LightbulbIcon />
            <h2 className="text-xl font-semibold text-slate-800">Posted Ideas</h2>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            {ideas.map(idea => (
              <div 
                key={idea.id}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-slate-800">{idea.title}</h3>
                <p className="text-sm text-slate-500 mt-1">By {idea.author}</p>
              </div>
            ))}
          </div>
        </section>

        {/* news section */}
        <section className="mb-20"> {/* Added margin-bottom for button space */}
          <div className="flex items-center gap-2 mb-4">
            <NewspaperIcon/>
            <h2 className="text-xl font-semibold text-slate-800">News</h2>
          </div>
          
          <div className="grid gap-4">
            {news.map(item => (
              <div 
                key={item.id}
                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-slate-800">{item.title}</h3>
                <p className="text-sm text-slate-500 mt-1">{item.date}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Centered Create Idea Button */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center z-20">
        <button
          onClick={handleCreateIdea}
          className="flex items-center gap-2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-lg hover:bg-slate-700 transition-colors"
          aria-label="Create new idea"
        >
          <PlusIcon />
          <span>Create idea</span>
        </button>
      </div>

      {/* mobilefriendlier-ish bottom padding */}
      <div className="h-20 sm:hidden"></div>
    </div>
  );
}
