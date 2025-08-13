import { useState } from 'react';
import { useRouter } from 'next/router';

interface Tab {
  name: string;
  href: string;
  panel: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
}

const Tabs = ({ tabs }: TabsProps) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState(0);

  const handleTabClick = (index: number, href: string) => {
    setActiveTab(index);
    if (href.startsWith('#')) {
      // Handle anchor links
      return;
    }
    // Handle navigation links
    if (href !== router.asPath) {
      router.push(href);
    }
  };

  return (
    <div>
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab, index) => (
            <button
              key={tab.name}
              onClick={() => handleTabClick(index, tab.href)}
              className={`
                py-2 px-1 border-b-2 font-medium text-sm
                ${
                  activeTab === index
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {tabs[activeTab]?.panel}
      </div>
    </div>
  );
};

export default Tabs;
