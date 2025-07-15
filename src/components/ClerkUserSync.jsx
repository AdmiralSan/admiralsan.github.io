// Component to handle user initialization and synchronization
import { useEffect } from 'react';
import { useAuth, useUser } from '@clerk/clerk-react';
import { syncClerkUser } from '../utils/clerkUserUtils';

const ClerkUserSync = ({ children }) => {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();

  useEffect(() => {
    const syncUser = async () => {
      if (isLoaded && userId && user) {
        try {
          await syncClerkUser(user);
          console.log('User synchronized with database');
        } catch (error) {
          console.error('Error synchronizing user:', error);
        }
      }
    };

    syncUser();
  }, [isLoaded, userId, user]);

  return children;
};

export default ClerkUserSync;
