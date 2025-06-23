# Profile Switching Feature Implementation Guide

## Overview

The profile switching feature allows users to manage multiple profiles (personal, business, freelance, corporate) within a single account while maintaining security through separate authentication for each profile.

## Architecture

### Database Design

#### Core Models

1. **Profile** - Main profile entity
   - `id`: Unique identifier
   - `name`: Display name
   - `type`: PERSONAL, BUSINESS, FREELANCE, CORPORATE
   - `status`: ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION
   - `ownerId`: User who owns the profile
   - `settings`: Profile-specific settings (JSON)
   - `metadata`: Additional profile data (JSON)

2. **ProfileMember** - Users who have access to a profile
   - `profileId`: Reference to profile
   - `userId`: Reference to user
   - `role`: User role within this profile
   - `permissions`: Profile-specific permissions (JSON)
   - `isActive`: Whether the membership is active

3. **ProfileSession** - Authentication sessions for profiles
   - `profileId`: Reference to profile
   - `userId`: Reference to user
   - `token`: Session token
   - `refreshToken`: Refresh token
   - `status`: ACTIVE, EXPIRED, REVOKED
   - `expiresAt`: Session expiration time

4. **ProfileInvitation** - Invitations to join profiles
   - `profileId`: Reference to profile
   - `invitedEmail/Phone`: Contact information
   - `invitedByUserId`: User who sent invitation
   - `role`: Role to be assigned
   - `expiresAt`: Invitation expiration

5. **CustomerProfile/ArtisanProfile** - Profile-specific data
   - Extends base profile with role-specific information
   - Separate tables for different profile types

### Security Features

1. **Separate Authentication**: Each profile requires its own authentication session
2. **Permission-based Access**: Granular permissions for different actions
3. **Session Management**: Secure token-based sessions with refresh capabilities
4. **Rate Limiting**: Prevents abuse of profile switching
5. **Audit Logging**: Tracks profile access and changes

## API Endpoints

### Profile Management

#### Create Profile
```http
POST /api/profiles/create
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "name": "My Business Profile",
  "type": "BUSINESS",
  "description": "Professional services profile",
  "avatar": "https://example.com/avatar.jpg",
  "settings": {
    "notifications": true,
    "privacy": "public"
  }
}
```

#### Get User Profiles
```http
GET /api/profiles/my-profiles
Authorization: Bearer <user_token>
```

#### Update Profile
```http
PUT /api/profiles/:profileId
Authorization: Bearer <profile_token>
Content-Type: application/json

{
  "name": "Updated Profile Name",
  "description": "Updated description"
}
```

#### Delete Profile
```http
DELETE /api/profiles/:profileId
Authorization: Bearer <profile_token>
```

### Profile Switching

#### Switch to Profile
```http
POST /api/profiles/switch
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "profileId": "uuid",
  "identifier": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Profile switched successfully",
  "requiresAuthentication": false,
  "profile": { ... },
  "session": {
    "token": "profile_session_token",
    "refreshToken": "refresh_token",
    "expiresAt": "2024-01-01T12:00:00Z"
  }
}
```

#### Authenticate Profile Switch
```http
POST /api/profiles/authenticate
Content-Type: application/json

{
  "profileId": "uuid",
  "identifier": "user@example.com",
  "otp": "123456"
}
```

#### Refresh Profile Session
```http
POST /api/profiles/refresh-session
Content-Type: application/json

{
  "refreshToken": "refresh_token"
}
```

### Profile Invitations

#### Invite User to Profile
```http
POST /api/profiles/:profileId/invite
Authorization: Bearer <profile_token>
Content-Type: application/json

{
  "invitedEmail": "newuser@example.com",
  "role": "CUSTOMER",
  "message": "Join our team!"
}
```

#### Accept Invitation
```http
POST /api/profiles/invitations/:invitationId/accept
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "userId": "user_uuid"
}
```

### Profile Analytics

#### Get Profile Analytics
```http
GET /api/profiles/:profileId/analytics
Authorization: Bearer <profile_token>
```

## Frontend Implementation

### State Management

#### Profile Context
```typescript
interface ProfileContextType {
  currentProfile: Profile | null;
  userProfiles: Profile[];
  profileSession: ProfileSession | null;
  switchProfile: (profileId: string) => Promise<void>;
  authenticateProfile: (otp: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  logoutProfile: () => void;
}
```

#### Profile Store (Redux/Zustand)
```typescript
interface ProfileState {
  profiles: Profile[];
  currentProfile: Profile | null;
  profileSession: ProfileSession | null;
  isLoading: boolean;
  error: string | null;
}

interface ProfileActions {
  fetchProfiles: () => Promise<void>;
  switchProfile: (profileId: string) => Promise<void>;
  authenticateProfile: (otp: string) => Promise<void>;
  refreshSession: () => Promise<void>;
  logoutProfile: () => void;
  updateProfile: (profileId: string, data: UpdateProfileRequest) => Promise<void>;
}
```

### Component Structure

#### Profile Switcher Component
```typescript
const ProfileSwitcher: React.FC = () => {
  const { profiles, currentProfile, switchProfile } = useProfile();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);

  const handleProfileSwitch = async (profile: Profile) => {
    try {
      setIsAuthenticating(true);
      const result = await switchProfile(profile.id);
      
      if (result.requiresAuthentication) {
        setSelectedProfile(profile);
        setShowOTPModal(true);
      }
    } catch (error) {
      console.error('Profile switch failed:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="profile-switcher">
      <div className="current-profile">
        <img src={currentProfile?.avatar} alt={currentProfile?.name} />
        <span>{currentProfile?.name}</span>
      </div>
      
      <div className="profile-list">
        {profiles.map(profile => (
          <div 
            key={profile.id} 
            className={`profile-item ${profile.id === currentProfile?.id ? 'active' : ''}`}
            onClick={() => handleProfileSwitch(profile)}
          >
            <img src={profile.avatar} alt={profile.name} />
            <span>{profile.name}</span>
            <span className="profile-type">{profile.type}</span>
          </div>
        ))}
      </div>

      {showOTPModal && selectedProfile && (
        <OTPModal
          profile={selectedProfile}
          onAuthenticate={handleAuthenticate}
          onClose={() => setShowOTPModal(false)}
        />
      )}
    </div>
  );
};
```

#### OTP Authentication Modal
```typescript
const OTPModal: React.FC<{ profile: Profile; onAuthenticate: (otp: string) => Promise<void>; onClose: () => void }> = ({ profile, onAuthenticate, onClose }) => {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await onAuthenticate(otp);
      onClose();
    } catch (error) {
      setError('Invalid OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <div className="otp-modal">
        <h3>Authenticate for {profile.name}</h3>
        <p>Enter the OTP sent to your email/phone to switch to this profile.</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            required
          />
          
          {error && <div className="error">{error}</div>}
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Authenticating...' : 'Authenticate'}
          </button>
        </form>
      </div>
    </Modal>
  );
};
```

### User Experience Flow

1. **Profile Selection**: User sees list of available profiles
2. **Switch Attempt**: User clicks on a profile to switch
3. **Authentication Check**: System checks if authentication is required
4. **OTP Request**: If required, system sends OTP to user's contact
5. **OTP Entry**: User enters OTP in modal
6. **Session Creation**: System creates profile session and switches context
7. **Profile Context**: All subsequent requests use profile-specific token

### Error Handling

#### Network Issues
```typescript
const handleNetworkError = (error: any) => {
  if (error.code === 'NETWORK_ERROR') {
    // Show offline message
    // Queue action for retry when online
    return;
  }
  
  if (error.code === 'SESSION_EXPIRED') {
    // Attempt to refresh session
    // If failed, redirect to login
    return;
  }
  
  // Show generic error message
};
```

#### Authentication Failures
```typescript
const handleAuthError = (error: any) => {
  switch (error.code) {
    case 'INVALID_OTP':
      // Show OTP error message
      break;
    case 'OTP_EXPIRED':
      // Request new OTP
      break;
    case 'RATE_LIMIT_EXCEEDED':
      // Show rate limit message
      break;
    default:
      // Show generic error
  }
};
```

## Security Considerations

### Token Security
- Profile tokens have shorter expiration (24h vs 7d)
- Separate refresh tokens for profile sessions
- Token rotation on refresh
- Secure token storage (httpOnly cookies)

### Permission System
- Granular permissions per profile
- Role-based access control
- Owner-only actions (delete, transfer ownership)
- Audit logging for sensitive operations

### Rate Limiting
- Profile switches: 10 per 5 minutes
- OTP requests: 5 per 15 minutes
- API calls: 1000 per hour per profile

### Data Isolation
- Profile-specific data storage
- Cross-profile data access controls
- Secure data deletion on profile removal

## Performance Optimization

### Caching Strategy
- Profile data: 30 minutes
- Session data: 5 minutes
- User permissions: 15 minutes
- Analytics data: 1 hour

### Database Optimization
- Indexed queries on profileId, userId
- Efficient joins for profile data
- Pagination for large datasets
- Connection pooling

### Frontend Optimization
- Lazy loading of profile data
- Memoized profile components
- Optimistic updates for better UX
- Background session refresh

## Testing Strategy

### Unit Tests
- Profile service methods
- Authentication middleware
- Permission checks
- Token generation/validation

### Integration Tests
- Profile switching flow
- OTP authentication
- Session management
- Invitation system

### E2E Tests
- Complete profile switching user journey
- Error scenarios
- Network failure handling
- Security edge cases

## Deployment Considerations

### Environment Variables
```bash
# Profile-specific settings
PROFILE_SESSION_TIMEOUT=1440 # 24 hours in minutes
PROFILE_CACHE_TTL=1800 # 30 minutes in seconds
PROFILE_RATE_LIMIT=10 # Max switches per window
PROFILE_OTP_RATE_LIMIT=5 # Max OTP requests per window
```

### Monitoring
- Profile switch success/failure rates
- Authentication time metrics
- Session duration analytics
- Error rate tracking

### Backup Strategy
- Regular database backups
- Profile data export capabilities
- Disaster recovery procedures

## Future Enhancements

1. **Multi-factor Authentication**: Additional security for sensitive profiles
2. **Profile Templates**: Pre-configured profile types
3. **Profile Analytics**: Advanced usage analytics
4. **Profile Sharing**: Temporary access sharing
5. **Profile Migration**: Move profiles between accounts
6. **API Rate Limiting**: Per-profile API limits
7. **Webhook Support**: Real-time profile events
8. **Mobile SDK**: Native mobile profile switching

## Troubleshooting

### Common Issues

1. **Session Expired**: Refresh token or re-authenticate
2. **Permission Denied**: Check user role and permissions
3. **Rate Limit Exceeded**: Wait before retrying
4. **Network Errors**: Check connectivity and retry
5. **Invalid OTP**: Request new OTP

### Debug Tools
- Profile session logs
- Authentication audit trail
- Performance metrics
- Error tracking

This comprehensive implementation provides a secure, scalable, and user-friendly profile switching system that can handle complex business requirements while maintaining high security standards. 