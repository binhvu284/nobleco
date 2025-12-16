import SettingsModal from '../../shared/components/SettingsModal';

export default function AdminSettingModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    return <SettingsModal open={open} onClose={onClose} />;
}
