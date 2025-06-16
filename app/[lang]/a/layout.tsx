import Layout from '../../../components/layout';

export default function FolderLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Layout>{children}</Layout>;
}