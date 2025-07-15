import React from 'react';
import { OrganizationSwitcher, CreateOrganization, useOrganization } from '@clerk/clerk-react';

// Component to add to your header/navigation
export const OrganizationHeader = () => {
  const { organization } = useOrganization();

  return (
    <div className="flex items-center space-x-4">
      {/* Show organization switcher if user is in an org */}
      {organization ? (
        <OrganizationSwitcher 
          organizationProfileMode="navigation"
          organizationProfileUrl="/organization"
          createOrganizationMode="navigation"
          createOrganizationUrl="/create-organization"
          afterSelectOrganizationUrl="/dashboard"
          appearance={{
            elements: {
              organizationSwitcherTrigger: "px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50",
              organizationSwitcherTriggerIcon: "w-4 h-4"
            }
          }}
        />
      ) : (
        <div className="text-sm text-gray-600">
          No organization - create one to manage users
        </div>
      )}
    </div>
  );
};

// Component for creating organizations (can be a separate page)
export const CreateOrganizationPage = () => {
  return (
    <div className="max-w-md mx-auto mt-8">
      <h1 className="text-2xl font-bold mb-6">Create Organization</h1>
      <CreateOrganization 
        afterCreateOrganizationUrl="/dashboard"
        appearance={{
          elements: {
            card: "shadow-lg border border-gray-200 rounded-lg",
            headerTitle: "text-xl font-semibold",
            formButtonPrimary: "bg-blue-600 hover:bg-blue-700"
          }
        }}
      />
    </div>
  );
};

// Hook to ensure user has an organization
export const useRequireOrganization = () => {
  const { organization, isLoaded } = useOrganization();
  
  React.useEffect(() => {
    if (isLoaded && !organization) {
      // Redirect to create organization page or show modal
      window.location.href = '/create-organization';
    }
  }, [isLoaded, organization]);

  return { organization, isLoaded, hasOrganization: !!organization };
};

// Wrapper component that ensures user is in an organization
export const RequireOrganization = ({ children, fallback = null }) => {
  const { hasOrganization, isLoaded } = useRequireOrganization();

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!hasOrganization) {
    return fallback || (
      <div className="text-center py-20">
        <div className="text-yellow-500 text-xl mb-4">No Organization</div>
        <p className="text-gray-600 mb-4">You need to be part of an organization to access this feature.</p>
        <a 
          href="/create-organization" 
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Create Organization
        </a>
      </div>
    );
  }

  return children;
};
