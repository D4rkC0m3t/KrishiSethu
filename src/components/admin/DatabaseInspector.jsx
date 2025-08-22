import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { RefreshCw } from 'lucide-react';

const DatabaseInspector = () => {
  const [usersTable, setUsersTable] = useState([]);
  const [profilesTable, setProfilesTable] = useState([]);
  const [userProfilesTable, setUserProfilesTable] = useState([]);
  const [loading, setLoading] = useState(false);

  const inspectTables = async () => {
    setLoading(true);
    console.log('🔍 Inspecting all user tables...');

    // Check users table
    try {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('Users table:', { data: usersData, error: usersError });
      setUsersTable(usersData || []);
    } catch (err) {
      console.log('Users table error:', err);
      setUsersTable([]);
    }

    // Check profiles table
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('Profiles table:', { data: profilesData, error: profilesError });
      setProfilesTable(profilesData || []);
    } catch (err) {
      console.log('Profiles table error:', err);
      setProfilesTable([]);
    }

    // Check user_profiles table
    try {
      const { data: userProfilesData, error: userProfilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      console.log('User_profiles table:', { data: userProfilesData, error: userProfilesError });
      setUserProfilesTable(userProfilesData || []);
    } catch (err) {
      console.log('User_profiles table error:', err);
      setUserProfilesTable([]);
    }

    setLoading(false);
  };

  const renderTable = (tableName, data) => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="text-lg">
          {tableName} ({data.length} records)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-gray-500">No data found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  {Object.keys(data[0] || {}).map(key => (
                    <th key={key} className="border border-gray-300 px-2 py-1 text-left font-semibold">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    {Object.entries(row).map(([key, value]) => (
                      <td key={key} className="border border-gray-300 px-2 py-1">
                        {value === null ? (
                          <span className="text-gray-400">null</span>
                        ) : typeof value === 'boolean' ? (
                          <span className={value ? 'text-green-600' : 'text-red-600'}>
                            {value.toString()}
                          </span>
                        ) : typeof value === 'object' ? (
                          <span className="text-blue-600">
                            {JSON.stringify(value)}
                          </span>
                        ) : (
                          <span>{String(value)}</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">Database Inspector</h1>
        <Button 
          onClick={inspectTables}
          disabled={loading}
          className="mb-4"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Inspecting...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4 mr-2" />
              Inspect All Tables
            </>
          )}
        </Button>
      </div>

      {renderTable('users', usersTable)}
      {renderTable('profiles', profilesTable)}
      {renderTable('user_profiles', userProfilesTable)}
    </div>
  );
};

export default DatabaseInspector;
