import Header from '../../../components/header';

export default function FolderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      <div className="flex-1 overflow-y-auto pt-16">
        {children}
      </div>
    </div>
  );
}