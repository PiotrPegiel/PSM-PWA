import React, { useEffect, useState } from 'react';
import useFirestore from '../../hooks/useFirestore';

const Reservations: React.FC = () => {
    const { documents } = useFirestore('collectionName');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            setData(documents);
            setLoading(false);
        };

        fetchData();
    }, [setData]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen text-lg font-medium">Loading...</div>;
    }

    return (
        <div className="p-6 pt-12">
            <h2 className="text-2xl font-bold mb-4">Data List</h2>
            <ul className="space-y-2">
                {data.map((item) => (
                    <li
                        key={item.id}
                        className="p-4 bg-white shadow rounded-lg border border-gray-200 hover:bg-gray-50 transition"
                    >
                        {item.name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Reservations;