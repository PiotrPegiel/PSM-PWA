import React, { useEffect, useState } from 'react';
import { useFirestore } from '../../hooks/useFirestore';

const DataList: React.FC = () => {
    const { getData } = useFirestore();
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchData = async () => {
            const result = await getData();
            setData(result);
            setLoading(false);
        };

        fetchData();
    }, [getData]);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="data-list">
            <h2>Data List</h2>
            <ul className="list-group">
                {data.map((item) => (
                    <li key={item.id} className="list-group-item">
                        {item.name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default DataList;