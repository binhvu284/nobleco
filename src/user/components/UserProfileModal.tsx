import { useState, useEffect, useRef } from 'react';
import { getCurrentUser, type User } from '../../auth';
import QRCode from 'qrcode';
import { uploadUserAvatar, deleteUserAvatar, type UserAvatar } from '../../utils/avatarUpload';
import { getAvatarInitial, getAvatarColor, getAvatarViewportStyles } from '../../utils/avatarUtils';
import { IconChevronDown } from '../../admin/components/icons';
import { compressImage } from '../../utils/imageCompression';
import { useTranslation } from '../../shared/contexts/TranslationContext';

// Country list for location dropdown
const COUNTRIES = [
    'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria', 'Bangladesh',
    'Belgium', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia', 'Czech Republic', 'Denmark',
    'Egypt', 'Finland', 'France', 'Germany', 'Greece', 'Hungary', 'India', 'Indonesia',
    'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Japan', 'Kenya', 'Malaysia', 'Mexico',
    'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan', 'Philippines', 'Poland',
    'Portugal', 'Romania', 'Russia', 'Saudi Arabia', 'Singapore', 'South Africa', 'South Korea',
    'Spain', 'Sweden', 'Switzerland', 'Thailand', 'Turkey', 'Ukraine', 'United Arab Emirates',
    'United Kingdom', 'United States', 'Vietnam', 'Other'
];

// States/Provinces/Cities mapping
const LOCATIONS: { [key: string]: string[] } = {
    'Vietnam': ['Ho Chi Minh City', 'Hanoi', 'Da Nang', 'Hai Phong', 'Can Tho', 'An Giang', 'Ba Ria-Vung Tau', 'Bac Lieu', 'Bac Giang', 'Bac Kan', 'Bac Ninh', 'Ben Tre', 'Binh Dinh', 'Binh Duong', 'Binh Phuoc', 'Binh Thuan', 'Ca Mau', 'Cao Bang', 'Dak Lak', 'Dak Nong', 'Dien Bien', 'Dong Nai', 'Dong Thap', 'Gia Lai', 'Ha Giang', 'Ha Nam', 'Ha Tinh', 'Hai Duong', 'Hau Giang', 'Hoa Binh', 'Hung Yen', 'Khanh Hoa', 'Kien Giang', 'Kon Tum', 'Lai Chau', 'Lam Dong', 'Lang Son', 'Lao Cai', 'Long An', 'Nam Dinh', 'Nghe An', 'Ninh Binh', 'Ninh Thuan', 'Phu Tho', 'Phu Yen', 'Quang Binh', 'Quang Nam', 'Quang Ngai', 'Quang Ninh', 'Quang Tri', 'Soc Trang', 'Son La', 'Tay Ninh', 'Thai Binh', 'Thai Nguyen', 'Thanh Hoa', 'Thua Thien-Hue', 'Tien Giang', 'Tra Vinh', 'Tuyen Quang', 'Vinh Long', 'Vinh Phuc', 'Yen Bai'],
    'United States': ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'],
    'United Kingdom': ['England', 'Scotland', 'Wales', 'Northern Ireland'],
    'Canada': ['Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'],
    'Australia': ['New South Wales', 'Victoria', 'Queensland', 'Western Australia', 'South Australia', 'Tasmania', 'Australian Capital Territory', 'Northern Territory'],
    'China': ['Beijing', 'Shanghai', 'Guangdong', 'Jiangsu', 'Zhejiang', 'Shandong', 'Henan', 'Sichuan', 'Hubei', 'Hunan', 'Fujian', 'Anhui', 'Liaoning', 'Jilin', 'Heilongjiang', 'Shaanxi', 'Shanxi', 'Hebei', 'Chongqing', 'Tianjin', 'Jiangxi', 'Guangxi', 'Yunnan', 'Inner Mongolia', 'Xinjiang', 'Guizhou', 'Gansu', 'Hainan', 'Ningxia', 'Qinghai', 'Tibet', 'Hong Kong', 'Macau'],
    'Other': []
};

export default function UserProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
    const { t } = useTranslation();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        country: '',
        state: ''
    });
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [showQrModal, setShowQrModal] = useState(false);
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);
    const [avatar, setAvatar] = useState<UserAvatar | null>(null);
    const [showAvatarCrop, setShowAvatarCrop] = useState(false);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string>('');
    const [imageScale, setImageScale] = useState(1); // Zoom scale for the image
    const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 }); // Image position for dragging
    const [frameSize, setFrameSize] = useState(300); // Fixed frame size (will be set based on image)
    const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
    const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const avatarImageRef = useRef<HTMLImageElement>(null);
    const cropContainerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    
    // Personal ID state
    const [personalID, setPersonalID] = useState<{
        front_image_url?: string;
        back_image_url?: string;
        front_image_path?: string;
        back_image_path?: string;
        verified?: boolean;
    } | null>(null);
    const [showPersonalIDExpanded, setShowPersonalIDExpanded] = useState<{ type: 'front' | 'back' } | null>(null);
    const [isUploadingPersonalID, setIsUploadingPersonalID] = useState(false);
    const [uploadingType, setUploadingType] = useState<'front' | 'back' | null>(null);
    const frontImageInputRef = useRef<HTMLInputElement>(null);
    const backImageInputRef = useRef<HTMLInputElement>(null);
    const [showAvatarExpanded, setShowAvatarExpanded] = useState(false);
    const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
    const [showCountryDropdown, setShowCountryDropdown] = useState(false);
    const [showStateDropdown, setShowStateDropdown] = useState(false);
    const countryDropdownRef = useRef<HTMLDivElement>(null);
    const stateDropdownRef = useRef<HTMLDivElement>(null);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string, id: string } | null>(null);

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
                setShowCountryDropdown(false);
            }
            if (stateDropdownRef.current && !stateDropdownRef.current.contains(e.target as Node)) {
                setShowStateDropdown(false);
            }
        };

        if (showCountryDropdown || showStateDropdown) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [showCountryDropdown, showStateDropdown]);

    useEffect(() => {
        if (open) {
            loadFreshUserData();
        } else {
            // Reset state when modal closes
            setUser(null);
            setIsLoading(false);
            setIsEditing(false);
            setError('');
        }
    }, [open]);

    const loadFreshUserData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const currentUser = getCurrentUser();
            if (!currentUser?.id) {
                setIsLoading(false);
                return;
            }

            // Fetch fresh data from database
            const response = await fetch(`/api/users?id=${currentUser.id}`);
            if (response.ok) {
                const data = await response.json();
                const freshUser = data.user;
                
                // Update localStorage with fresh data
                localStorage.setItem('nobleco_user_data', JSON.stringify(freshUser));
                
                // Update local state
                setUser(freshUser);
                // Parse location if it exists (for backward compatibility)
                let country = freshUser.country || '';
                let state = freshUser.state || '';
                // If country/state don't exist but location does, try to parse it
                if (!country && freshUser.location) {
                    // Try to parse "State, Country" format
                    const parts = freshUser.location.split(',').map((s: string) => s.trim());
                    if (parts.length === 2) {
                        state = parts[0];
                        country = parts[1];
                    } else {
                        country = freshUser.location;
                    }
                }
                setFormData({
                    name: freshUser.name || '',
                    address: freshUser.address || '',
                    country: country,
                    state: state
                });
                
                // Load avatar
                await loadUserAvatar(Number(freshUser.id));
                
                // Update avatar state if user data includes avatar URL
                if (freshUser.avatar) {
                    setAvatar({ url: freshUser.avatar } as UserAvatar);
                }
                
                // Load personal ID
                await loadPersonalID(Number(freshUser.id));
                
                // Generate QR code
                if (freshUser.refer_code) {
                    generateQRCode(freshUser.refer_code);
                }
                
                // Trigger storage event for header update
                window.dispatchEvent(new Event('storage'));
            } else {
                // Fallback to localStorage if API fails
                console.log('Using cached user data from localStorage');
                setUser(currentUser);
                // Parse location if it exists (for backward compatibility)
                let country = (currentUser as any).country || '';
                let state = (currentUser as any).state || '';
                if (!country && currentUser.location) {
                    const parts = currentUser.location.split(',').map((s: string) => s.trim());
                    if (parts.length === 2) {
                        state = parts[0];
                        country = parts[1];
                    } else {
                        country = currentUser.location;
                    }
                }
                setFormData({
                    name: currentUser.name || '',
                    address: currentUser.address || '',
                    country: country,
                    state: state
                });
                if (currentUser.refer_code) {
                    generateQRCode(currentUser.refer_code);
                }
            }
        } catch (err) {
            console.error('Error loading user data:', err);
            // Fallback to localStorage
            const currentUser = getCurrentUser();
            if (currentUser) {
                setUser(currentUser);
                // Parse location if it exists (for backward compatibility)
                let country = (currentUser as any).country || '';
                let state = (currentUser as any).state || '';
                if (!country && currentUser.location) {
                    const parts = currentUser.location.split(',').map((s: string) => s.trim());
                    if (parts.length === 2) {
                        state = parts[0];
                        country = parts[1];
                    } else {
                        country = currentUser.location;
                    }
                }
                setFormData({
                    name: currentUser.name || '',
                    address: currentUser.address || '',
                    country: country,
                    state: state
                });
                if (currentUser.refer_code) {
                    generateQRCode(currentUser.refer_code);
                }
            }
        } finally {
            setIsLoading(false);
            setIsEditing(false);
            setError('');
        }
    };

    const generateQRCode = async (referCode: string) => {
        try {
            // Create signup URL with pre-filled refer code
            const signupUrl = `${window.location.origin}/signup?ref=${referCode}`;
            const qrDataUrl = await QRCode.toDataURL(signupUrl, {
                width: 200,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });
            setQrCodeUrl(qrDataUrl);
        } catch (err) {
            console.error('Error generating QR code:', err);
        }
    };

    const getReferLink = () => {
        if (!user?.refer_code) return '';
        return `${window.location.origin}/signup?ref=${user.refer_code}`;
    };

    const copyReferCode = async () => {
        if (!user?.refer_code) return;
        try {
            await navigator.clipboard.writeText(user.refer_code);
            setNotification({ type: 'success', message: 'Refer code copied!', id: 'refer-code' });
            setTimeout(() => setNotification(null), 2000);
        } catch (err) {
            setNotification({ type: 'error', message: 'Failed to copy refer code', id: 'refer-code' });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const copyReferLink = async () => {
        const referLink = getReferLink();
        if (!referLink) return;
        try {
            await navigator.clipboard.writeText(referLink);
            setNotification({ type: 'success', message: 'Link copied!', id: 'refer-link' });
            setTimeout(() => setNotification(null), 2000);
        } catch (err) {
            setNotification({ type: 'error', message: 'Failed to copy link', id: 'refer-link' });
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const downloadQRCode = () => {
        if (!qrCodeUrl || !user?.refer_code) return;
        
        const link = document.createElement('a');
        link.download = `referral-qr-${user.refer_code}.png`;
        link.href = qrCodeUrl;
        link.click();
    };

    const expandQRCode = () => {
        setShowQrModal(true);
    };

    const closeQrModal = () => {
        setShowQrModal(false);
    };

    const handleSave = async () => {
        if (!user?.id) return;
        
        setIsSaving(true);
        setError('');
        
        try {
            const response = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: user.id,
                    name: formData.name,
                    address: formData.address,
                    country: formData.country,
                    state: formData.state,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Failed to update profile');
                setIsSaving(false);
                return;
            }

            // Update localStorage with new user data (use data from server as source of truth)
            localStorage.setItem('nobleco_user_data', JSON.stringify(data.user));
            
            // Update local state with fresh data from server
            setUser(data.user);
            
            // Update form data with the latest values from server
            setFormData({
                name: data.user.name || '',
                address: data.user.address || '',
                country: data.user.country || '',
                state: data.user.state || ''
            });
            
            setIsEditing(false);
            
            // Trigger a storage event to notify other components (like header)
            window.dispatchEvent(new Event('storage'));
            
            // Show success feedback
            console.log('Profile updated successfully');
        } catch (err) {
            setError('Failed to connect to server. Please try again.');
            console.error('Profile update error:', err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (user) {
            // Parse location if it exists (for backward compatibility)
            let country = (user as any).country || '';
            let state = (user as any).state || '';
            if (!country && user.location) {
                const parts = user.location.split(',').map((s: string) => s.trim());
                if (parts.length === 2) {
                    state = parts[0];
                    country = parts[1];
                } else {
                    country = user.location;
                }
            }
            setFormData({
                name: user.name || '',
                address: user.address || '',
                country: country,
                state: state
            });
        }
        setError('');
        setIsEditing(false);
    };

    const getLevelBadgeClass = (level?: string) => {
        if (!level) return 'level-badge level-guest';
        return `level-badge level-${level.replace(/\s+/g, '-')}`;
    };

    const loadUserAvatar = async (userId: number) => {
        try {
            const response = await fetch(`/api/user-avatars?userId=${userId}`);
            if (response.ok) {
                const avatarData = await response.json();
                if (avatarData) {
                    setAvatar(avatarData);
                } else {
                    setAvatar(null);
                }
            }
        } catch (error) {
            console.error('Error loading avatar:', error);
            setAvatar(null);
        }
    };

    const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('Image file is too large. Maximum size is 10MB.');
                return;
            }
            
            setAvatarFile(file);
            setError(''); // Clear any previous errors
            const reader = new FileReader();
            reader.onload = (e) => {
                setAvatarPreview(e.target?.result as string);
                setShowAvatarCrop(true);
                // Crop data will be initialized when image loads in the modal
            };
            reader.onerror = () => {
                setError('Failed to read image file. Please try again.');
            };
            reader.readAsDataURL(file);
        } else {
            setError('Please select a valid image file.');
        }
    };


    // Handler for Change button - opens file picker
    const handleChangeAvatar = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.setAttribute('capture', 'user'); // Use front-facing camera for avatar
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                handleAvatarFileSelect({ target: { files: [file] } } as any);
            }
        };
        input.click();
    };

    // Handler for Remove button - deletes avatar
    const handleRemoveAvatar = async () => {
        if (!user?.id) return;
        
        if (!confirm('Are you sure you want to remove your avatar? It will revert to the default letter avatar.')) {
            return;
        }

        setIsUploadingAvatar(true);
        setError('');

        try {
            await deleteUserAvatar(Number(user.id));
            setAvatar(null);
            
            // Reload user data
            await loadFreshUserData();
            
            // Update localStorage
            const currentUser = getCurrentUser();
            if (currentUser) {
                const updatedUser = { ...currentUser, avatar: undefined };
                localStorage.setItem('nobleco_user_data', JSON.stringify(updatedUser));
            }
            
            // Dispatch events
            window.dispatchEvent(new CustomEvent('avatarUpdated', {
                detail: { avatarUrl: null }
            }));
            window.dispatchEvent(new Event('storage'));
        } catch (error: any) {
            setError(error.message || 'Failed to remove avatar. Please try again.');
            console.error('Avatar removal error:', error);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleCropConfirm = async () => {
        if (!avatarFile || !user?.id || !avatarImageRef.current || !imageDimensions || !cropContainerRef.current) {
            setError('Missing required data. Please try again.');
            return;
        }

        setIsUploadingAvatar(true);
        setError(''); // Clear any previous errors
        
        try {
            // Get container dimensions
            const containerRect = cropContainerRef.current.getBoundingClientRect();
            const imgRect = avatarImageRef.current.getBoundingClientRect();
            
            const displaySize = {
                width: imgRect.width,
                height: imgRect.height
            };

            if (displaySize.width === 0 || displaySize.height === 0) {
                throw new Error('Image dimensions are invalid. Please try again.');
            }

            // Frame is centered in container
            const frameCenterX = containerRect.width / 2;
            const frameCenterY = containerRect.height / 2;
            
            // Calculate scaled image dimensions
            const scaledImageWidth = imageDimensions.width * imageScale;
            const scaledImageHeight = imageDimensions.height * imageScale;
            
            // Image position is relative to container center
            // Calculate where image top-left is
            const imageLeft = (containerRect.width - scaledImageWidth) / 2 + imagePosition.x;
            const imageTop = (containerRect.height - scaledImageHeight) / 2 + imagePosition.y;
            
            // Frame center relative to image top-left
            const frameCenterRelativeToImage = {
                x: frameCenterX - imageLeft,
                y: frameCenterY - imageTop
            };
            
            // Convert to original image coordinates (divide by scale)
            const viewportX = frameCenterRelativeToImage.x / imageScale;
            const viewportY = frameCenterRelativeToImage.y / imageScale;
            
            // Calculate as ratios (0-1) relative to original image dimensions
            const viewportData = {
                x: viewportX / imageDimensions.width,
                y: viewportY / imageDimensions.height,
                width: frameSize,
                height: frameSize, // Circular frame
                displaySize
            };
            
            const uploadedAvatar = await uploadUserAvatar(Number(user.id), avatarFile, {
                viewportData: {
                    x: viewportData.x,
                    y: viewportData.y,
                    width: viewportData.width,
                    height: viewportData.height,
                    displaySize
                }
            });
            
            if (!uploadedAvatar || !uploadedAvatar.url) {
                throw new Error('Upload succeeded but avatar data is missing.');
            }
            
            setAvatar(uploadedAvatar);
            setShowAvatarCrop(false);
            setAvatarFile(null);
            setAvatarPreview('');
            setImageScale(1);
            setImagePosition({ x: 0, y: 0 });
            setImageDimensions(null);
            
            // Reload user data to get updated avatar URL
            await loadFreshUserData();
            
            // Update localStorage with avatar URL
            const currentUser = getCurrentUser();
            if (currentUser && uploadedAvatar.url) {
                const updatedUser = { ...currentUser, avatar: uploadedAvatar.url };
                localStorage.setItem('nobleco_user_data', JSON.stringify(updatedUser));
            }
            
            // Dispatch custom event to notify header of avatar update
            window.dispatchEvent(new CustomEvent('avatarUpdated', {
                detail: { avatarUrl: uploadedAvatar.url }
            }));
            
            // Also trigger storage event for other components
            window.dispatchEvent(new Event('storage'));
            
            // Show success message briefly
            const successMsg = 'Avatar uploaded successfully!';
            setError(''); // Clear error if any
            // You could add a success notification here if you have one
        } catch (error: any) {
            const errorMessage = error.message || 'Failed to upload avatar. Please try again.';
            setError(errorMessage);
            console.error('Avatar upload error:', error);
        } finally {
            setIsUploadingAvatar(false);
        }
    };

    const handleCropCancel = () => {
        setShowAvatarCrop(false);
        setAvatarFile(null);
        setAvatarPreview('');
        setImageScale(1);
        setImagePosition({ x: 0, y: 0 });
        setImageDimensions(null);
    };

    // Handle image dragging (move image behind fixed frame)
    const handleImageMouseDown = (e: React.MouseEvent) => {
        if (!cropContainerRef.current || !avatarImageRef.current) return;
        
        setIsDragging(true);
        
        const containerRect = cropContainerRef.current.getBoundingClientRect();
        
        // Calculate offset from mouse to current image position
        setDragStart({
            x: e.clientX - containerRect.left - imagePosition.x,
            y: e.clientY - containerRect.top - imagePosition.y
        });
        
        e.preventDefault();
        e.stopPropagation();
    };

    const handleImageMouseUp = () => {
        setIsDragging(false);
    };

    // Add document-level mouse event listeners for smooth dragging
    useEffect(() => {
        if (!isDragging || !cropContainerRef.current || !imageDimensions) return;
        
        const handleMove = (e: MouseEvent) => {
            if (!cropContainerRef.current) return;
            
            const containerRect = cropContainerRef.current.getBoundingClientRect();
            
            // Calculate new image position
            const mouseX = e.clientX - containerRect.left;
            const mouseY = e.clientY - containerRect.top;
            
            let newX = mouseX - dragStart.x;
            let newY = mouseY - dragStart.y;
            
            // Constrain image position so it doesn't go too far
            // Calculate scaled image dimensions
            const scaledWidth = imageDimensions.width * imageScale;
            const scaledHeight = imageDimensions.height * imageScale;
            
            // Allow some movement but keep image visible within reasonable bounds
            const maxX = (containerRect.width - scaledWidth) / 2 + containerRect.width * 0.5;
            const maxY = (containerRect.height - scaledHeight) / 2 + containerRect.height * 0.5;
            const minX = (containerRect.width - scaledWidth) / 2 - containerRect.width * 0.5;
            const minY = (containerRect.height - scaledHeight) / 2 - containerRect.height * 0.5;
            
            newX = Math.max(minX, Math.min(maxX, newX));
            newY = Math.max(minY, Math.min(maxY, newY));
            
            setImagePosition({ x: newX, y: newY });
        };
        
        const handleUp = () => {
            setIsDragging(false);
        };
        
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
        
        return () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
        };
    }, [isDragging, dragStart, imageScale, imageDimensions]);


    // Handler for zoom slider (zoom in/out image)
    const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newScale = parseFloat(e.target.value);
        setImageScale(newScale);
    };

    // Personal ID functions
    const loadPersonalID = async (userId: number) => {
        try {
            const token = localStorage.getItem('nobleco_auth_token');
            const response = await fetch(`/api/user-personal-ids?userId=${userId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                if (data && (data.front_image_url || data.back_image_url)) {
                    setPersonalID(data);
                } else {
                    setPersonalID(null);
                }
            }
        } catch (error) {
            console.error('Error loading personal ID:', error);
            setPersonalID(null);
        }
    };

    const handlePersonalIDUpload = async (type: 'front' | 'back', file: File) => {
        if (!user?.id) return;
        
        setIsUploadingPersonalID(true);
        setUploadingType(type);
        setError('');

        try {
            // Validate file
            if (!file.type.startsWith('image/')) {
                throw new Error('Please select a valid image file');
            }
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('Image file is too large. Maximum size is 10MB.');
            }

            // Compress image before upload to prevent 413 errors
            let fileToUpload = file;
            try {
                fileToUpload = await compressImage(file, {
                    maxWidth: 2000,  // Reasonable size for ID images
                    maxHeight: 2000,
                    quality: 0.85,   // Good quality with compression
                    maxSizeMB: 2     // Max 2MB after compression
                });
            } catch (compressError) {
                console.warn('Image compression failed, uploading original:', compressError);
                // Continue with original file if compression fails
            }

            // Convert compressed file to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onload = () => {
                    const result = reader.result as string;
                    // Remove data:image/...;base64, prefix
                    const base64 = result.split(',')[1];
                    resolve(base64);
                };
                reader.onerror = reject;
            });
            reader.readAsDataURL(fileToUpload);

            const base64Data = await base64Promise;
            const timestamp = Date.now();
            const fileExt = fileToUpload.name.split('.').pop() || 'jpg';
            const fileName = `${type}_${timestamp}.${fileExt}`;
            const storagePath = `${user.id}/${fileName}`;

            // Upload to storage via API
            const token = localStorage.getItem('nobleco_auth_token');
            const uploadResponse = await fetch(`/api/user-personal-ids?userId=${Number(user.id)}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    [type === 'front' ? 'frontImage' : 'backImage']: base64Data,
                    fileName: fileName,
                    storagePath: storagePath,
                    mimeType: fileToUpload.type,
                }),
            });

            // Read response once
            const responseText = await uploadResponse.text();
            
            if (!uploadResponse.ok) {
                let errorMessage = 'Failed to upload image';
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error || errorMessage;
                } catch (e) {
                    // If response is not JSON, use the text directly
                    errorMessage = `Server error: ${uploadResponse.status} - ${responseText.substring(0, 100)}`;
                }
                throw new Error(errorMessage);
            }

            // Parse successful response
            const result = JSON.parse(responseText);

            // Reload personal ID data
            await loadPersonalID(Number(user.id));
        } catch (error: any) {
            setError(error.message || 'Failed to upload personal ID image');
            console.error('Personal ID upload error:', error);
        } finally {
            setIsUploadingPersonalID(false);
            setUploadingType(null);
        }
    };

    const handlePersonalIDDelete = async (type: 'front' | 'back') => {
        if (!user?.id || !personalID) return;
        
        if (!confirm(`Are you sure you want to delete the ${type === 'front' ? 'front' : 'back'} side image?`)) {
            return;
        }

        setIsUploadingPersonalID(true);
        setUploadingType(type);
        setError('');

        try {
            const token = localStorage.getItem('nobleco_auth_token');
            const response = await fetch(`/api/user-personal-ids?userId=${Number(user.id)}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete image');
            }

            // Update local state
            setPersonalID(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    [type === 'front' ? 'front_image_url' : 'back_image_url']: undefined,
                    [type === 'front' ? 'front_image_path' : 'back_image_path']: undefined,
                };
            });
        } catch (error: any) {
            setError(error.message || 'Failed to delete personal ID image');
            console.error('Personal ID delete error:', error);
        } finally {
            setIsUploadingPersonalID(false);
            setUploadingType(null);
        }
    };

    const handlePersonalIDFileSelect = (type: 'front' | 'back', e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handlePersonalIDUpload(type, file);
        }
        // Reset input
        e.target.value = '';
    };

    return (
        <>
            {open && !showQrModal && (
                <>
                    <div className="modal-overlay" onClick={onClose} />
                    <div className="profile-modal-card" role="dialog" aria-modal="true">
                        <div className="modal-header">
                            <span>Your Profile</span>
                            <button className="modal-close" aria-label="Close" onClick={onClose}>✕</button>
                        </div>
                        
                        {isLoading ? (
                            <div className="profile-loading">
                                <div className="loading-spinner">
                                    <div className="spinner-ring"></div>
                                    <div className="spinner-ring"></div>
                                    <div className="spinner-ring"></div>
                                </div>
                                <p>Loading profile...</p>
                            </div>
                        ) : user ? (
                            <div className="profile-content">
                    {/* Avatar Section */}
                    <div className="profile-avatar-section">
                        <div 
                            className="profile-avatar-wrapper" 
                            style={{ 
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '16px'
                            }}
                            onMouseEnter={() => !isEditing && avatar?.url && setIsHoveringAvatar(true)}
                            onMouseLeave={() => setIsHoveringAvatar(false)}
                        >
                            {avatar?.url ? (
                                <img 
                                    className="profile-avatar-large" 
                                    src={avatar.url} 
                                    alt={user.name || 'avatar'}
                                    style={isEditing ? {
                                        ...getAvatarViewportStyles(avatar, 180),
                                        minWidth: '180px',
                                        minHeight: '180px'
                                    } : getAvatarViewportStyles(avatar, 120)}
                                    onError={(e) => {
                                        // Fallback to default if image fails to load
                                        const target = e.target as HTMLImageElement;
                                        target.style.display = 'none';
                                        const parent = target.parentElement;
                                        if (parent && user.name) {
                                            const fallback = document.createElement('div');
                                            fallback.className = 'profile-avatar-large';
                                            fallback.style.cssText = `
                                                width: ${isEditing ? '180px' : '120px'};
                                                height: ${isEditing ? '180px' : '120px'};
                                                border-radius: 50%;
                                                background-color: ${getAvatarColor(user.name)};
                                                display: flex;
                                                align-items: center;
                                                justify-content: center;
                                                color: white;
                                                font-size: ${isEditing ? '72px' : '48px'};
                                                font-weight: 600;
                                                text-transform: uppercase;
                                            `;
                                            fallback.textContent = getAvatarInitial(user.name);
                                            parent.appendChild(fallback);
                                        }
                                    }}
                                />
                            ) : (
                                <div 
                                    className="profile-avatar-large"
                                    style={{
                                        width: isEditing ? '180px' : '120px',
                                        height: isEditing ? '180px' : '120px',
                                        borderRadius: '50%',
                                        backgroundColor: getAvatarColor(user.name || 'User'),
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: isEditing ? '72px' : '48px',
                                        fontWeight: 600,
                                        textTransform: 'uppercase',
                                        flexShrink: 0
                                    }}
                                >
                                    {getAvatarInitial(user.name || 'User')}
                                </div>
                            )}
                            {isEditing && (
                                <div style={{
                                    display: 'flex',
                                    gap: '8px',
                                    flexDirection: 'column',
                                    alignItems: 'flex-start',
                                    justifyContent: 'center'
                                }}>
                                    <button
                                        onClick={handleChangeAvatar}
                                        disabled={isUploadingAvatar}
                                        style={{
                                            background: '#10b981',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '36px',
                                            height: '36px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                            transition: 'all 0.2s ease',
                                            flexShrink: 0
                                        }}
                                        title="Upload avatar"
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                    </button>
                                    {avatar?.url && (
                                        <button
                                            onClick={handleRemoveAvatar}
                                            disabled={isUploadingAvatar}
                                            style={{
                                                background: '#ef4444',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '50%',
                                                width: '36px',
                                                height: '36px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                                transition: 'all 0.2s ease',
                                                flexShrink: 0
                                            }}
                                            title="Remove avatar"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <polyline points="3 6 5 6 21 6" />
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                            </svg>
                                        </button>
                                    )}
                                </div>
                            )}
                            {!isEditing && avatar?.url && isHoveringAvatar && (
                                <button
                                    className="avatar-view-btn"
                                    onClick={() => setShowAvatarExpanded(true)}
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        left: '50%',
                                        transform: 'translate(-50%, -50%)',
                                        background: 'rgba(0, 0, 0, 0.7)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '8px',
                                        padding: '8px 16px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        transition: 'all 0.2s ease',
                                        zIndex: 10
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.9)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.7)';
                                    }}
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                    View
                                </button>
                            )}
                        </div>
                        <div className="profile-level-info">
                            <span className={getLevelBadgeClass(user.level)}>
                                {user.level === 'unit manager' ? 'Unit Manager' : 
                                 user.level === 'brand manager' ? 'Brand Manager' : 
                                 user.level ? user.level.charAt(0).toUpperCase() + user.level.slice(1) : 'Guest'}
                            </span>
                            <div className="profile-points">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                </svg>
                                {user.points || 0} Points
                            </div>
                        </div>
                    </div>

                    {/* Profile Information */}
                    <div className="profile-info-grid">
                        {/* Non-Editable Section */}
                        <div className="profile-section">
                            <h3 className="profile-section-title">{t('profile.accountInformation')}</h3>
                            <div className="profile-fields">
                                <div className="profile-field">
                                    <label>{t('profile.email')}</label>
                                    <div className="profile-field-value email-display">{user.email}</div>
                                </div>
                                <div className="profile-field">
                                    <label>{t('profile.phoneNumber')}</label>
                                    <div className="profile-field-value">{user.phone || t('settings.notSet')}</div>
                                </div>
                                <div className="profile-field refer-code-field">
                                    <label>{t('profile.referCode')}</label>
                                    <p className="field-description">
                                        {t('profile.referCodeDescription')}
                                    </p>
                                    {user.refer_code ? (
                                        <div className="refer-code-compact-container">
                                            {/* Refer Code Row */}
                                            <div className="refer-code-row">
                                                <div className="refer-code-value-compact">
                                                    <span>{user.refer_code}</span>
                                                    <button 
                                                        className="copy-btn-inline" 
                                                        title={t('profile.copyReferCode')}
                                                        onClick={copyReferCode}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                        </svg>
                                                    </button>
                                                    {notification && notification.id === 'refer-code' && (
                                                        <div className={`inline-notification ${notification.type}`}>
                                                            {notification.type === 'success' ? '✓' : '✕'} {notification.message}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Referral Link Row */}
                                            <div className="refer-link-row">
                                                <label className="refer-link-label">{t('profile.referralLink')}</label>
                                                <div className="refer-link-value-compact">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={getReferLink()}
                                                        className="refer-link-input"
                                                        onClick={(e) => (e.target as HTMLInputElement).select()}
                                                    />
                                                    <button 
                                                        className="copy-btn-inline" 
                                                        title={t('profile.copyReferralLink')}
                                                        onClick={copyReferLink}
                                                    >
                                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                                        </svg>
                                                    </button>
                                                    {notification && notification.id === 'refer-link' && (
                                                        <div className={`inline-notification ${notification.type}`}>
                                                            {notification.type === 'success' ? '✓' : '✕'} {notification.message}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* QR Code Row */}
                                            {qrCodeUrl && (
                                                <div className="qr-code-row">
                                                    <div className="qr-code-horizontal">
                                                        <img src={qrCodeUrl} alt="QR Code" className="qr-code-image" />
                                                        <div className="qr-actions-horizontal">
                                                            <button 
                                                                className="qr-action-btn-horizontal" 
                                                                title={t('profile.expandQRCode')}
                                                                onClick={expandQRCode}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="15 3 21 3 21 9" />
                                                                    <polyline points="9 21 3 21 3 15" />
                                                                    <line x1="21" y1="3" x2="14" y2="10" />
                                                                    <line x1="3" y1="21" x2="10" y2="14" />
                                                                </svg>
                                                            </button>
                                                            <button 
                                                                className="qr-action-btn-horizontal" 
                                                                title={t('profile.downloadQRCode')}
                                                                onClick={downloadQRCode}
                                                            >
                                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                    <polyline points="7 10 12 15 17 10" />
                                                                    <line x1="12" y1="15" x2="12" y2="3" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="profile-field-value non-editable">{t('profile.notAvailable')}</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Editable Section */}
                        <div className="profile-section">
                            <div className="profile-section-header">
                                <h3 className="profile-section-title">{t('profile.personalInformation')}</h3>
                                {!isEditing && (
                                    <button className="edit-btn" onClick={() => setIsEditing(true)}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                        </svg>
                                        {t('common.edit')}
                                    </button>
                                )}
                            </div>
                            <div className="profile-fields">
                                <div className="profile-field">
                                    <label>{t('profile.name')}</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder={t('profile.enterYourName')}
                                        />
                                    ) : (
                                        <div className="profile-field-value">{formData.name || t('settings.notSet')}</div>
                                    )}
                                </div>
                                <div className="profile-field profile-field-full">
                                    <label>{t('profile.address')}</label>
                                    {isEditing ? (
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder={t('profile.enterYourAddress')}
                                            rows={2}
                                        />
                                    ) : (
                                        <div className="profile-field-value">{formData.address || t('settings.notSet')}</div>
                                    )}
                                </div>
                                <div className="profile-field profile-field-full" style={{ display: 'flex', flexDirection: 'row', gap: '16px' }}>
                                    <div className="profile-field" style={{ flex: 1 }}>
                                        <label>{t('profile.country')}</label>
                                        {isEditing ? (
                                            <div className="location-dropdown-wrapper" ref={countryDropdownRef}>
                                                <div
                                                    className="location-dropdown-toggle"
                                                    onClick={() => {
                                                        setShowCountryDropdown(!showCountryDropdown);
                                                        setShowStateDropdown(false);
                                                    }}
                                                >
                                                    <span className={formData.country ? '' : 'location-placeholder'}>
                                                        {formData.country || t('profile.selectCountry')}
                                                    </span>
                                                    <IconChevronDown className={showCountryDropdown ? 'rotated' : ''} style={{ width: '12px', height: '12px' }} />
                                                </div>
                                                {showCountryDropdown && (
                                                    <div className="location-dropdown-menu">
                                                        <div className="location-dropdown-options">
                                                            <div
                                                                className={`location-dropdown-option ${!formData.country ? 'selected' : ''}`}
                                                                onClick={() => {
                                                                    setFormData({ ...formData, country: '', state: '' });
                                                                    setShowCountryDropdown(false);
                                                                }}
                                                            >
                                                                {t('profile.selectCountry')}
                                                            </div>
                                                            {COUNTRIES.map(country => (
                                                                <div
                                                                    key={country}
                                                                    className={`location-dropdown-option ${formData.country === country ? 'selected' : ''}`}
                                                                    onClick={() => {
                                                                        setFormData({ ...formData, country: country, state: '' });
                                                                        setShowCountryDropdown(false);
                                                                    }}
                                                                >
                                                                    {country}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="profile-field-value">{formData.country || t('settings.notSet')}</div>
                                        )}
                                    </div>
                                    <div className="profile-field" style={{ flex: 1 }}>
                                        <label>{t('profile.stateProvinceCity')}</label>
                                        {isEditing ? (
                                            <div className="location-dropdown-wrapper" ref={stateDropdownRef}>
                                                <div
                                                    className={`location-dropdown-toggle ${formData.country && LOCATIONS[formData.country] && LOCATIONS[formData.country].length > 0 ? '' : 'disabled'}`}
                                                    onClick={() => {
                                                        if (formData.country && LOCATIONS[formData.country] && LOCATIONS[formData.country].length > 0) {
                                                            setShowStateDropdown(!showStateDropdown);
                                                            setShowCountryDropdown(false);
                                                        }
                                                    }}
                                                >
                                                    <span className={formData.state ? '' : 'location-placeholder'}>
                                                        {formData.state || (formData.country && LOCATIONS[formData.country] && LOCATIONS[formData.country].length > 0 ? t('profile.selectStateProvinceCity') : formData.country ? t('profile.noLocationsAvailable') : t('profile.selectCountryFirst'))}
                                                    </span>
                                                    {formData.country && LOCATIONS[formData.country] && LOCATIONS[formData.country].length > 0 && (
                                                        <IconChevronDown className={showStateDropdown ? 'rotated' : ''} style={{ width: '12px', height: '12px' }} />
                                                    )}
                                                </div>
                                                {showStateDropdown && formData.country && LOCATIONS[formData.country] && LOCATIONS[formData.country].length > 0 && (
                                                    <div className="location-dropdown-menu">
                                                        <div className="location-dropdown-options">
                                                            <div
                                                                className={`location-dropdown-option ${!formData.state ? 'selected' : ''}`}
                                                                onClick={() => {
                                                                    setFormData({ ...formData, state: '' });
                                                                    setShowStateDropdown(false);
                                                                }}
                                                            >
                                                                {t('profile.selectStateProvinceCity')}
                                                            </div>
                                                            {LOCATIONS[formData.country].map(location => (
                                                                <div
                                                                    key={location}
                                                                    className={`location-dropdown-option ${formData.state === location ? 'selected' : ''}`}
                                                                    onClick={() => {
                                                                        setFormData({ ...formData, state: location });
                                                                        setShowStateDropdown(false);
                                                                    }}
                                                                >
                                                                    {location}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="profile-field-value">{formData.state || t('settings.notSet')}</div>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Personal ID Field */}
                                <div className="profile-field profile-field-full personal-id-field">
                                    <label>{t('profile.personalID')}</label>
                                    <div className="personal-id-container">
                                        {/* Front Side */}
                                        <div className="personal-id-item">
                                            <div className="personal-id-label">{t('profile.frontSide')}</div>
                                            {personalID?.front_image_url ? (
                                                <div className="personal-id-image-wrapper">
                                                    <img 
                                                        src={personalID.front_image_url} 
                                                        alt="Front side of personal ID"
                                                        className="personal-id-thumbnail"
                                                    />
                                                    {isEditing && (
                                                        <div className="personal-id-actions">
                                                            <button
                                                                className="personal-id-expand-btn"
                                                                onClick={() => setShowPersonalIDExpanded({ type: 'front' })}
                                                                title={t('profile.expandImage')}
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="15 3 21 3 21 9" />
                                                                    <polyline points="9 21 3 21 3 15" />
                                                                    <line x1="21" y1="3" x2="14" y2="10" />
                                                                    <line x1="3" y1="21" x2="10" y2="14" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="personal-id-delete-btn"
                                                                onClick={() => handlePersonalIDDelete('front')}
                                                                disabled={isUploadingPersonalID}
                                                                title={t('profile.deleteImage')}
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="3 6 5 6 21 6" />
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                    {!isEditing && (
                                                        <button
                                                            className="personal-id-expand-btn"
                                                            onClick={() => setShowPersonalIDExpanded({ type: 'front' })}
                                                            title={t('profile.expandImage')}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="15 3 21 3 21 9" />
                                                                <polyline points="9 21 3 21 3 15" />
                                                                <line x1="21" y1="3" x2="14" y2="10" />
                                                                <line x1="3" y1="21" x2="10" y2="14" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                isEditing ? (
                                                    <label className={`personal-id-upload-area ${isUploadingPersonalID && uploadingType === 'front' ? 'uploading' : ''}`}>
                                                        <input
                                                            ref={frontImageInputRef}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handlePersonalIDFileSelect('front', e)}
                                                            disabled={isUploadingPersonalID}
                                                            style={{ display: 'none' }}
                                                        />
                                                        {isUploadingPersonalID && uploadingType === 'front' ? (
                                                            <div className="personal-id-upload-placeholder uploading">
                                                                <div className="upload-spinner">
                                                                    <div className="spinner-ring"></div>
                                                                    <div className="spinner-ring"></div>
                                                                    <div className="spinner-ring"></div>
                                                                </div>
                                                                <span>{t('profile.uploading')}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="personal-id-upload-placeholder">
                                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                    <polyline points="17 8 12 3 7 8" />
                                                                    <line x1="12" y1="3" x2="12" y2="15" />
                                                                </svg>
                                                                <span>{t('profile.uploadFrontSide')}</span>
                                                            </div>
                                                        )}
                                                    </label>
                                                ) : (
                                                    <div className="personal-id-empty">{t('profile.notUploaded')}</div>
                                                )
                                            )}
                                        </div>

                                        {/* Back Side */}
                                        <div className="personal-id-item">
                                            <div className="personal-id-label">{t('profile.backSide')}</div>
                                            {personalID?.back_image_url ? (
                                                <div className="personal-id-image-wrapper">
                                                    <img 
                                                        src={personalID.back_image_url} 
                                                        alt="Back side of personal ID"
                                                        className="personal-id-thumbnail"
                                                    />
                                                    {isEditing && (
                                                        <div className="personal-id-actions">
                                                            <button
                                                                className="personal-id-expand-btn"
                                                                onClick={() => setShowPersonalIDExpanded({ type: 'back' })}
                                                                title={t('profile.expandImage')}
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="15 3 21 3 21 9" />
                                                                    <polyline points="9 21 3 21 3 15" />
                                                                    <line x1="21" y1="3" x2="14" y2="10" />
                                                                    <line x1="3" y1="21" x2="10" y2="14" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                className="personal-id-delete-btn"
                                                                onClick={() => handlePersonalIDDelete('back')}
                                                                disabled={isUploadingPersonalID}
                                                                title={t('profile.deleteImage')}
                                                            >
                                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <polyline points="3 6 5 6 21 6" />
                                                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    )}
                                                    {!isEditing && (
                                                        <button
                                                            className="personal-id-expand-btn"
                                                            onClick={() => setShowPersonalIDExpanded({ type: 'back' })}
                                                            title={t('profile.expandImage')}
                                                        >
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="15 3 21 3 21 9" />
                                                                <polyline points="9 21 3 21 3 15" />
                                                                <line x1="21" y1="3" x2="14" y2="10" />
                                                                <line x1="3" y1="21" x2="10" y2="14" />
                                                            </svg>
                                                        </button>
                                                    )}
                                                </div>
                                            ) : (
                                                isEditing ? (
                                                    <label className={`personal-id-upload-area ${isUploadingPersonalID && uploadingType === 'back' ? 'uploading' : ''}`}>
                                                        <input
                                                            ref={backImageInputRef}
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => handlePersonalIDFileSelect('back', e)}
                                                            disabled={isUploadingPersonalID}
                                                            style={{ display: 'none' }}
                                                        />
                                                        {isUploadingPersonalID && uploadingType === 'back' ? (
                                                            <div className="personal-id-upload-placeholder uploading">
                                                                <div className="upload-spinner">
                                                                    <div className="spinner-ring"></div>
                                                                    <div className="spinner-ring"></div>
                                                                    <div className="spinner-ring"></div>
                                                                </div>
                                                                <span>{t('profile.uploading')}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="personal-id-upload-placeholder">
                                                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                                                    <polyline points="17 8 12 3 7 8" />
                                                                    <line x1="12" y1="3" x2="12" y2="15" />
                                                                </svg>
                                                                <span>{t('profile.uploadBackSide')}</span>
                                                            </div>
                                                        )}
                                                    </label>
                                                ) : (
                                                    <div className="personal-id-empty">{t('profile.notUploaded')}</div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && !showAvatarCrop && (
                        <div style={{ 
                            marginTop: '16px', 
                            padding: '12px', 
                            background: '#fee2e2', 
                            border: '1px solid #fca5a5',
                            borderRadius: '8px',
                            color: '#dc2626',
                            textAlign: 'center',
                            fontSize: '0.875rem'
                        }}>
                            {error}
                        </div>
                    )}

                                {/* Action Buttons */}
                                {isEditing && (
                                    <div className="profile-actions profile-actions-fixed">
                                        <button className="btn-secondary" onClick={handleCancel} disabled={isSaving}>
                                            {t('common.cancel')}
                                        </button>
                                        <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                                            {isSaving ? t('profile.saving') : t('profile.saveChanges')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="profile-error">
                                <p>{t('profile.failedToLoadProfile')}</p>
                                <button className="btn-primary" onClick={loadFreshUserData}>
                                    {t('profile.retry')}
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* Avatar Expanded Modal */}
            {showAvatarExpanded && avatar?.url && (
                <div className="modal-overlay personal-id-expanded-overlay" onClick={() => setShowAvatarExpanded(false)}>
                    <div className="personal-id-expanded-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="personal-id-expanded-header">
                            <h3>{t('profile.avatar')}</h3>
                            <button className="modal-close" onClick={() => setShowAvatarExpanded(false)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="personal-id-expanded-content">
                            <img 
                                src={avatar.url} 
                                alt="User avatar"
                                className="personal-id-expanded-image"
                                style={{ maxWidth: '90vw', maxHeight: '90vh', width: 'auto', height: 'auto', objectFit: 'contain' }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Personal ID Expanded Modal */}
            {showPersonalIDExpanded && personalID && (
                <div className="modal-overlay personal-id-expanded-overlay" onClick={() => setShowPersonalIDExpanded(null)}>
                    <div className="personal-id-expanded-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="personal-id-expanded-header">
                            <h3>{showPersonalIDExpanded.type === 'front' ? t('profile.frontSidePersonalID') : t('profile.backSidePersonalID')}</h3>
                            <button className="modal-close" onClick={() => setShowPersonalIDExpanded(null)}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="personal-id-expanded-content">
                            <img 
                                src={showPersonalIDExpanded.type === 'front' ? personalID.front_image_url : personalID.back_image_url} 
                                alt={`${showPersonalIDExpanded.type === 'front' ? 'Front' : 'Back'} side of personal ID`}
                                className="personal-id-expanded-image"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Expanded Modal */}
            {showQrModal && user && (
                <div className="modal-overlay qr-modal-overlay" onClick={closeQrModal}>
                    <div className="qr-modal-card" onClick={(e) => e.stopPropagation()}>
                        <div className="qr-modal-header">
                            <h3>{t('profile.referralQRCode')}</h3>
                            <button className="close-btn" onClick={closeQrModal}>
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>
                        </div>
                        <div className="qr-modal-content">
                            <div className="qr-code-large">
                                <img src={qrCodeUrl} alt="Referral QR Code" />
                            </div>
                            <p className="qr-modal-description">
                                Share this QR code with others to invite them to sign up with your referral code: <strong>{user?.refer_code}</strong>
                            </p>
                            <button className="btn-primary" onClick={downloadQRCode} style={{ width: '100%', marginTop: '16px' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="7 10 12 15 17 10" />
                                    <line x1="12" y1="15" x2="12" y2="3" />
                                </svg>
                                Download QR Code
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Avatar Crop Modal */}
            {showAvatarCrop && avatarPreview && (
                <div className="modal-overlay" onClick={handleCropCancel} style={{ zIndex: 10000, background: 'rgba(16, 24, 40, 0.38)', backdropFilter: 'blur(2px)' }}>
                    <div 
                        className="profile-modal-card" 
                        onClick={(e) => e.stopPropagation()}
                        style={{ 
                            maxWidth: '700px', 
                            width: '90%',
                            maxHeight: '90vh',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            position: 'relative'
                        }}
                    >
                        <div className="modal-header" style={{ flexShrink: 0 }}>
                            <span>Crop Avatar</span>
                            <button className="modal-close" onClick={handleCropCancel}>✕</button>
                        </div>
                        <div style={{ 
                            padding: '20px',
                            overflowY: 'auto',
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            minHeight: 0
                        }}>
                            <div style={{ marginBottom: '16px', textAlign: 'center', flexShrink: 0 }}>
                                <label htmlFor="zoom-slider" style={{ 
                                    display: 'block', 
                                    marginBottom: '12px', 
                                    fontSize: '0.875rem', 
                                    color: '#6b7280',
                                    fontWeight: 500
                                }}>
                                    Zoom: {Math.round(imageScale * 100)}%
                                </label>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                    <input
                                        id="zoom-slider"
                                        type="range"
                                        min="0.5"
                                        max="3"
                                        step="0.1"
                                        value={imageScale}
                                        onChange={handleZoomChange}
                                        className="crop-size-slider"
                                        style={{ 
                                            width: '80%',
                                            maxWidth: '400px',
                                            cursor: 'pointer',
                                            height: '8px',
                                            margin: 0,
                                            verticalAlign: 'middle'
                                        }}
                                    />
                                </div>
                            </div>
                            {error && (
                                <div style={{ 
                                    marginBottom: '16px', 
                                    padding: '12px', 
                                    background: '#fee2e2', 
                                    border: '1px solid #fca5a5',
                                    borderRadius: '8px',
                                    color: '#dc2626',
                                    fontSize: '0.875rem'
                                }}>
                                    {error}
                                </div>
                            )}
                            <div 
                                ref={cropContainerRef}
                                style={{
                                    position: 'relative',
                                    width: '100%',
                                    maxWidth: '100%',
                                    margin: '0 auto',
                                    border: '2px solid #e5e7eb',
                                    borderRadius: '8px',
                                    overflow: 'hidden',
                                    cursor: isDragging ? 'grabbing' : 'grab',
                                    backgroundColor: '#f9fafb',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    flex: 1,
                                    minHeight: 0,
                                    maxHeight: 'calc(90vh - 250px)',
                                    padding: '20px'
                                }}
                            >
                                <div style={{ 
                                    position: 'relative', 
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    width: '100%',
                                    height: '100%',
                                    overflow: 'hidden'
                                }}>
                                    <img
                                        ref={avatarImageRef}
                                        src={avatarPreview}
                                        alt="Preview"
                                        style={{
                                            width: imageDimensions ? `${imageDimensions.width * imageScale}px` : 'auto',
                                            height: imageDimensions ? `${imageDimensions.height * imageScale}px` : 'auto',
                                            objectFit: 'contain',
                                            display: 'block',
                                            transform: `translate(${imagePosition.x}px, ${imagePosition.y}px)`,
                                            cursor: isDragging ? 'grabbing' : 'grab',
                                            userSelect: 'none',
                                            transition: isDragging ? 'none' : 'transform 0.1s ease-out'
                                        }}
                                        draggable={false}
                                        onMouseDown={handleImageMouseDown}
                                        onLoad={(e) => {
                                            // Initialize when image loads
                                            const img = e.currentTarget;
                                            setTimeout(() => {
                                                const naturalWidth = img.naturalWidth;
                                                const naturalHeight = img.naturalHeight;
                                                
                                                if (naturalWidth > 0 && naturalHeight > 0) {
                                                    // Set frame size to fit largest dimension (with some padding)
                                                    const containerRect = cropContainerRef.current?.getBoundingClientRect();
                                                    if (containerRect) {
                                                        const containerAspectRatio = containerRect.width / containerRect.height;
                                                        const imageAspectRatio = naturalWidth / naturalHeight;
                                                        
                                                        let displayedWidth, displayedHeight;
                                                        if (imageAspectRatio > containerAspectRatio) {
                                                            displayedWidth = containerRect.width * 0.9;
                                                            displayedHeight = displayedWidth / imageAspectRatio;
                                                        } else {
                                                            displayedHeight = containerRect.height * 0.9;
                                                            displayedWidth = displayedHeight * imageAspectRatio;
                                                        }
                                                        
                                                        setImageDimensions({ width: displayedWidth, height: displayedHeight });
                                                        setFrameSize(Math.min(displayedWidth, displayedHeight) * 0.8);
                                                    }
                                                }
                                            }, 100);
                                        }}
                                    />
                                    {/* Fixed circular frame overlay */}
                                    <div
                                        style={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            width: `${frameSize}px`,
                                            height: `${frameSize}px`,
                                            border: '3px solid #3b82f6',
                                            borderRadius: '50%',
                                            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                                            pointerEvents: 'none',
                                            zIndex: 10
                                        }}
                                    />
                                </div>
                            </div>
                            <div style={{ 
                                marginTop: '24px', 
                                display: 'flex', 
                                gap: '12px', 
                                justifyContent: 'flex-end',
                                flexShrink: 0,
                                paddingTop: '16px',
                                borderTop: '1px solid #e5e7eb'
                            }}>
                                <button 
                                    className="btn-secondary" 
                                    onClick={handleCropCancel}
                                    disabled={isUploadingAvatar}
                                >
                                    {t('common.cancel')}
                                </button>
                                <button 
                                    className="btn-primary" 
                                    onClick={handleCropConfirm}
                                    disabled={isUploadingAvatar || !imageDimensions}
                                    style={{
                                        opacity: (isUploadingAvatar || !imageDimensions) ? 0.6 : 1,
                                        cursor: (isUploadingAvatar || !imageDimensions) ? 'not-allowed' : 'pointer'
                                    }}
                                >
                                    {isUploadingAvatar ? (
                                        <>
                                            <span style={{ 
                                                display: 'inline-block', 
                                                marginRight: '8px',
                                                animation: 'spin 1s linear infinite'
                                            }}>
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                                                </svg>
                                            </span>
                                            Uploading...
                                        </>
                                    ) : (
                                        'Upload Avatar'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
