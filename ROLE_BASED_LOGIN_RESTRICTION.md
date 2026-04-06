# Role-Based Login Restriction

## Overview
Implemented a restriction system that prevents users from logging in with a different role than they registered with. If an email is registered as a Rider, it cannot be used to login as a Driver, and vice versa.

## Problem
Previously, users could potentially:
- Register as a Rider with email@example.com
- Try to login as a Driver with the same email@example.com
- This could cause confusion and data inconsistency

## Solution
Added role validation at both registration and login stages to ensure users can only access the system with their registered role.

## Implementation

### 1. Backend - Registration (`server/controllers/authController.js`)

**Added role conflict check:**
```javascript
const existingUser = await User.findOne({ email });
if (existingUser) {
  // Check if trying to register with a different role
  const requestedRole = role === 'driver' ? 'driver' : 'user';
  if (existingUser.role !== requestedRole) {
    return res.status(400).json({ 
      success: false, 
      message: `This email is already registered as a ${existingUser.role === 'driver' ? 'Driver' : 'Rider'}. Please use a different email or login with your existing account.` 
    });
  }
  return res.status(400).json({ 
    success: false, 
    message: 'User with this email already exists' 
  });
}
```

**Benefits:**
- Prevents duplicate registrations with different roles
- Clear error message guides user to correct action
- Maintains data integrity

### 2. Backend - Login (`server/controllers/authController.js`)

**Added role validation:**
```javascript
// Check if user is trying to login with a different role
if (role) {
  const requestedRole = role === 'driver' ? 'driver' : 'user';
  if (user.role !== requestedRole) {
    return res.status(403).json({
      success: false,
      message: `This email is registered as a ${user.role === 'driver' ? 'Driver' : 'Rider'}. Please login from the correct page or use a different email.`,
      registeredRole: user.role
    });
  }
}
```

**Benefits:**
- Validates role before password check
- Returns 403 Forbidden status
- Includes registered role in response for frontend handling
- Clear error message

### 3. Frontend - AuthContext (`client/src/context/AuthContext.js`)

**Updated login function to accept role:**
```javascript
const login = useCallback(async (email, password, role) => {
  const res = await authAPI.login({ email, password, role });
  const { token: newToken, user: userData } = res.data;
  
  setToken(newToken);
  setUser(userData);
  localStorage.setItem('ditmate_token', newToken);
  localStorage.setItem('ditmate_user', JSON.stringify(userData));
  connectSocket(newToken);
  
  return userData;
}, []);
```

### 4. Frontend - Login Page (`client/src/app/auth/login/page.js`)

**Enhanced error handling:**
```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const userData = await login(formData.email, formData.password, role);
    toast.success('Welcome back!');
    if (userData?.role === 'driver') router.push('/driver/dashboard');
    else router.push('/dashboard');
  } catch (error) {
    const errorMsg = error.response?.data?.message || 'Login failed';
    toast.error(errorMsg);
    
    // If wrong role, show helpful message
    if (error.response?.status === 403 && error.response?.data?.registeredRole) {
      const registeredRole = error.response.data.registeredRole;
      setTimeout(() => {
        toast(
          `Tip: This email is registered as ${registeredRole === 'driver' ? 'Driver' : 'Rider'}. Please select the correct role.`,
          { icon: '💡', duration: 5000 }
        );
      }, 1000);
    }
  } finally { setLoading(false); }
};
```

**Benefits:**
- Shows primary error message immediately
- Displays helpful tip after 1 second
- Guides user to select correct role
- Better user experience

## User Flows

### Scenario 1: Correct Role Login (Success)

1. User registered as Rider with rider@example.com
2. User goes to login page
3. User selects "I'm a Rider"
4. User enters rider@example.com and password
5. Backend validates: role matches ✓
6. Login successful → Redirected to /dashboard

### Scenario 2: Wrong Role Login (Error)

1. User registered as Rider with rider@example.com
2. User goes to login page
3. User selects "I'm a Driver" (wrong!)
4. User enters rider@example.com and password
5. Backend validates: role mismatch ✗
6. Error: "This email is registered as a Rider. Please login from the correct page or use a different email."
7. Tip toast: "💡 Tip: This email is registered as Rider. Please select the correct role."
8. User clicks "← Back" and selects "I'm a Rider"
9. Login successful

### Scenario 3: Duplicate Registration with Different Role (Error)

1. User already registered as Driver with driver@example.com
2. User tries to register as Rider with same email
3. Backend checks: email exists with different role ✗
4. Error: "This email is already registered as a Driver. Please use a different email or login with your existing account."
5. User clicks "Log In" link
6. Selects "I'm a Driver"
7. Login successful

### Scenario 4: Duplicate Registration with Same Role (Error)

1. User already registered as Rider with rider@example.com
2. User tries to register as Rider again with same email
3. Backend checks: email exists with same role ✗
4. Error: "User with this email already exists"
5. User clicks "Log In" link
6. Login successful

## Error Messages

### Registration Errors

**Different Role:**
```
"This email is already registered as a Driver. Please use a different email or login with your existing account."
```

**Same Role:**
```
"User with this email already exists"
```

### Login Errors

**Wrong Role:**
```
"This email is registered as a Rider. Please login from the correct page or use a different email."
```

**Helpful Tip (after 1 second):**
```
"💡 Tip: This email is registered as Rider. Please select the correct role."
```

## API Changes

### POST /api/auth/register

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "driver"
}
```

**Response (Error - Different Role):**
```json
{
  "success": false,
  "message": "This email is already registered as a Rider. Please use a different email or login with your existing account."
}
```

### POST /api/auth/login

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "password123",
  "role": "driver"
}
```

**Response (Error - Wrong Role):**
```json
{
  "success": false,
  "message": "This email is registered as a Rider. Please login from the correct page or use a different email.",
  "registeredRole": "user"
}
```

**Response (Success):**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "driver",
    ...
  }
}
```

## Testing Checklist

### Registration Tests
- [ ] Register as Rider with new email → Success
- [ ] Register as Driver with new email → Success
- [ ] Register as Rider with existing Rider email → Error (same role)
- [ ] Register as Driver with existing Rider email → Error (different role)
- [ ] Register as Rider with existing Driver email → Error (different role)
- [ ] Register as Driver with existing Driver email → Error (same role)

### Login Tests
- [ ] Login as Rider with Rider email → Success
- [ ] Login as Driver with Driver email → Success
- [ ] Login as Rider with Driver email → Error (wrong role)
- [ ] Login as Driver with Rider email → Error (wrong role)
- [ ] Error message shows correct registered role
- [ ] Helpful tip appears after 1 second
- [ ] User can go back and select correct role

### UI/UX Tests
- [ ] Role selection screen shows both options
- [ ] Selected role shows badge
- [ ] Back button works correctly
- [ ] Error toasts are clear and helpful
- [ ] Tip toast provides guidance
- [ ] Login redirects to correct dashboard

## Security Benefits

1. **Prevents Role Confusion**: Users can't accidentally login with wrong role
2. **Data Integrity**: Ensures user data remains consistent
3. **Clear Boundaries**: Separates Rider and Driver functionalities
4. **Better UX**: Guides users to correct login path
5. **Audit Trail**: Role validation logged in backend

## Future Enhancements

1. **Role Switching**: Allow users to upgrade from Rider to Driver
2. **Multi-Role Support**: Enable users to have both roles with same email
3. **Role Migration**: Provide admin tools to change user roles
4. **Email Verification**: Add email verification before role assignment

## Files Modified

1. `server/controllers/authController.js`
   - Added role conflict check in register
   - Added role validation in login

2. `client/src/context/AuthContext.js`
   - Updated login function to accept role parameter

3. `client/src/app/auth/login/page.js`
   - Pass role to login function
   - Enhanced error handling with helpful tips

## Summary

The role-based login restriction ensures that:
- ✅ One email = One role
- ✅ Riders can only login as Riders
- ✅ Drivers can only login as Drivers
- ✅ Clear error messages guide users
- ✅ Better data integrity and security
