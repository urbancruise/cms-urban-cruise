'use client';

import { useEffect, useState } from 'react';

interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const [strength, setStrength] = useState({ 
    score: 0, 
    label: 'Weak', 
    color: 'red',
    percentage: 0 
  });

  useEffect(() => {
    if (!password) {
      setStrength({ score: 0, label: 'Weak', color: 'red', percentage: 0 });
      return;
    }

    let score = 0;
    
    // Length check
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    
    // Complexity checks
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) score++;

    // Determine strength
    let label = 'Weak';
    let color = 'red';
    let percentage = 0;
    
    if (score >= 6) { 
      label = 'Strong'; 
      color = 'green'; 
      percentage = 100;
    } else if (score >= 4) { 
      label = 'Good'; 
      color = 'yellow'; 
      percentage = 70;
    } else if (score >= 2) { 
      label = 'Fair'; 
      color = 'orange'; 
      percentage = 40;
    } else {
      label = 'Weak';
      color = 'red';
      percentage = 20;
    }

    setStrength({ score, label, color, percentage });
  }, [password]);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1">
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-in-out`}
            style={{ 
              width: `${strength.percentage}%`,
              backgroundColor: strength.color === 'green' ? '#22c55e' : 
                              strength.color === 'yellow' ? '#eab308' : 
                              strength.color === 'orange' ? '#f97316' : '#ef4444'
            }}
          />
        </div>
        <span 
          className={`text-xs font-semibold min-w-[40px] text-right`}
          style={{ 
            color: strength.color === 'green' ? '#22c55e' : 
                   strength.color === 'yellow' ? '#eab308' : 
                   strength.color === 'orange' ? '#f97316' : '#ef4444'
          }}
        >
          {strength.label}
        </span>
      </div>
      
      <div className="mt-2 text-xs space-y-1">
        <div className="flex items-center gap-2">
          <span className={password.length >= 6 ? 'text-green-500' : 'text-gray-400'}>
            {password.length >= 6 ? '✅' : '⬜'}
          </span>
          <span className={password.length >= 6 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}>
            At least 6 characters
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-green-500' : 'text-gray-400'}>
            {/[a-z]/.test(password) && /[A-Z]/.test(password) ? '✅' : '⬜'}
          </span>
          <span className={/[a-z]/.test(password) && /[A-Z]/.test(password) ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}>
            Uppercase & lowercase letters
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={/[0-9]/.test(password) ? 'text-green-500' : 'text-gray-400'}>
            {/[0-9]/.test(password) ? '✅' : '⬜'}
          </span>
          <span className={/[0-9]/.test(password) ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}>
            At least one number
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-green-500' : 'text-gray-400'}>
            {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? '✅' : '⬜'}
          </span>
          <span className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}>
            At least one special character (!@#$%^&*)
          </span>
        </div>
      </div>
    </div>
  );
}
