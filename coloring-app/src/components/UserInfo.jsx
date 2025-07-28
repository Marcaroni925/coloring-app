import React, { memo, useMemo } from 'react'

const UserInfo = ({ user, className = "" }) => {
  const userDisplayInfo = useMemo(() => {
    if (!user) return null
    
    return {
      initial: user.displayName 
        ? user.displayName.charAt(0).toUpperCase() 
        : user.email.charAt(0).toUpperCase(),
      displayName: user.displayName || user.email
    }
  }, [user])

  if (!user || !userDisplayInfo) {
    return null
  }

  return (
    <div className={`flex items-center space-x-2 text-sm text-gray-600 ${className}`}>
      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
        <span className="text-blue-600 font-medium">
          {userDisplayInfo.initial}
        </span>
      </div>
      <span className="max-w-32 truncate">
        {userDisplayInfo.displayName}
      </span>
    </div>
  )
}

export default memo(UserInfo)