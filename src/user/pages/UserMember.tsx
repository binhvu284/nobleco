import UserLayout from '../components/UserLayout';

export default function UserMember() {
    return (
        <UserLayout title="My Member">
            <div className="user-member">
                <p style={{ color: 'var(--muted)', marginTop: '20px' }}>
                    Member management page - Coming soon!
                </p>
            </div>
        </UserLayout>
    );
}

