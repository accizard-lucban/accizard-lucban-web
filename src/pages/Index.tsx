import { Layout } from "@/components/Layout";
import { DashboardStats } from "@/components/DashboardStats";
const Index = () => {
  return <Layout>
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        
      </div>

      {/* Main Content */}
      <div className="p-8">
        <DashboardStats />
      </div>
    </Layout>;
};
export default Index;