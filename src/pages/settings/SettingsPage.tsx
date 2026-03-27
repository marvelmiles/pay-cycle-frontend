import React, { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { profileService } from "../../services/api";
import { Card, CardHeader, CardBody, Button, Input } from "../../components/ui";
import { useAuthStore } from "../../stores/auth.store";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Camera, Building2, User as UserIcon, Wallet } from "lucide-react";

const profileSchema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName: z.string().min(1, "Required"),
});
type ProfileForm = z.infer<typeof profileSchema>;

const businessSchema = z.object({
  name: z.string().min(1, "Required"),
  slug: z.string().min(1, "Required"),
});

type BusinessForm = z.infer<typeof businessSchema>;

const bankSchema = z.object({
  name: z.string().min(1, "Required"),
  accountNumber: z
    .string()
    .regex(/^\d{10}$/, "Account number must be exactly 10 digits"),
  accountName: z.string().min(1, "Required"),
});

type BankForm = z.infer<typeof bankSchema>;

export const EditBankDetailsCard = () => {
  const { business, updateBusiness } = useAuthStore();

  const [editBank, setEditBank] = useState(false);

  const bankForm = useForm<BankForm>({
    resolver: zodResolver(bankSchema),
    defaultValues: {
      name: business?.bank.name || "",
      accountName: business?.bank.accountName || "",
      accountNumber: business?.bank.accountNumber || "",
    },
  });

  const values = bankForm.getValues();

  const [isPending, setIsPending] = useState(false);

  const onSubmit = async (data: BankForm) => {
    try {
      setIsPending(true);
      const res = await profileService.updateBusiness(business?.id || "", {
        bank: data,
      });

      updateBusiness({
        ...business,
        ...res.data?.data,
      } as any);
    } catch (err) {
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-gray-400" />
            <h2 className="font-semibold text-gray-900">
              Bank Account Details
            </h2>
          </div>
          {!editBank && (
            <Button variant="ghost" size="sm" onClick={() => setEditBank(true)}>
              Edit Bank
            </Button>
          )}
        </div>
      </CardHeader>
      <CardBody>
        {editBank ? (
          <form
            onSubmit={bankForm.handleSubmit(onSubmit)}
            className="space-y-6"
          >
            <div className="space-y-4">
              <Input
                label="Bank Name"
                {...bankForm.register("name")}
                error={bankForm.formState.errors.name?.message}
              />
              <Input
                label="Bank Account Name"
                {...bankForm.register("accountName")}
                error={bankForm.formState.errors.accountName?.message}
              />
              <Input
                label="Bank Account Number"
                {...bankForm.register("accountNumber")}
                error={bankForm.formState.errors.accountNumber?.message}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditBank(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={isPending}>
                Save Details
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-6">
            <div className="grid grid-cols-2 gap-x-12 gap-y-4 flex-1">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  Bank Name
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {values?.name || "--"}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  Account Name
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-sm font-semibold text-gray-900">
                    {values.accountName || "--"}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  Account Number
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-0.5">
                  {values.accountNumber || "--"}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export const SettingsPage: React.FC = () => {
  const { user, business, updateUser, updateBusiness } = useAuthStore();
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [businessLogo, setBusinessLogo] = useState<File | null>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
    },
  });

  const businessForm = useForm<BusinessForm>({
    resolver: zodResolver(businessSchema),
    values: {
      name: business?.name || "",
      slug: business?.slug || "",
    },
  });

  const profileMutation = useMutation({
    mutationFn: (fd: FormData) => profileService.updateProfile(fd),
    onSuccess: (res) => {
      if (res.data.success) {
        toast.success(res.data.message || "Profile updated");
        updateUser({
          ...user,
          ...res.data.data,
          firstName: profileForm.getValues().firstName,
          lastName: profileForm.getValues().lastName,
        } as any);
        setEditingProfile(false);
        setProfileImage(null);
      } else {
        toast.error(res.data.message || "Update failed");
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to update profile";
      toast.error(msg);
    },
  });

  const businessMutation = useMutation({
    mutationFn: (fd: FormData) =>
      profileService.updateBusiness(business?.id || "", fd),
    onSuccess: (res) => {
      if (res.data.success) {
        toast.success(res.data.message || "Business updated");
        updateBusiness({
          ...business,
          ...res.data.data,
          name: businessForm.getValues().name,
          slug: businessForm.getValues().slug,
        } as any);
        setEditingBusiness(false);
        setBusinessLogo(null);
      } else {
        toast.error(res.data.message || "Update failed");
      }
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || "Failed to update business";
      toast.error(msg);
    },
  });

  const onProfileSubmit = (data: ProfileForm) => {
    const fd = new FormData();
    fd.append("firstName", data.firstName);
    fd.append("lastName", data.lastName);
    if (profileImage) {
      fd.append("image", profileImage);
    }
    profileMutation.mutate(fd);
  };

  const onBusinessSubmit = (data: BusinessForm) => {
    const fd = new FormData();
    fd.append("name", data.name);
    fd.append("slug", data.slug);
    if (businessLogo) {
      fd.append("image", businessLogo);
    }
    businessMutation.mutate(fd);
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">
          Manage your account and business settings
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Personal Profile</h2>
            </div>
            {!editingProfile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingProfile(true)}
              >
                Edit Profile
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {editingProfile ? (
            <form
              onSubmit={profileForm.handleSubmit(onProfileSubmit)}
              className="space-y-6"
            >
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                    {profileImage ? (
                      <img
                        src={URL.createObjectURL(profileImage)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : user?.image ? (
                      <img
                        src={user.image}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full">
                    <Camera className="h-5 w-5" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) =>
                        setProfileImage(e.target.files?.[0] || null)
                      }
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Profile Photo
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    JPG, GIF or PNG. Max size 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  {...profileForm.register("firstName")}
                  error={profileForm.formState.errors.firstName?.message}
                />
                <Input
                  label="Last Name"
                  {...profileForm.register("lastName")}
                  error={profileForm.formState.errors.lastName?.message}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingProfile(false);
                    setProfileImage(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={profileMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xl">
                {user?.image ? (
                  <img
                    src={user.image}
                    alt="Profile"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user?.firstName?.[0] || "U"
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 flex-1">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    Full Name
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {user?.firstName} {user?.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    Email Address
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {user?.email}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    Account Role
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5 capitalize">
                    {user?.role}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Business Details Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-400" />
              <h2 className="font-semibold text-gray-900">Business Details</h2>
            </div>
            {!editingBusiness && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditingBusiness(true)}
              >
                Edit Business
              </Button>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {editingBusiness ? (
            <form
              onSubmit={businessForm.handleSubmit(onBusinessSubmit)}
              className="space-y-6"
            >
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300 overflow-hidden">
                    {businessLogo ? (
                      <img
                        src={URL.createObjectURL(businessLogo)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : business?.image ? (
                      <img
                        src={business.image}
                        alt="Logo"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-gray-300" />
                    )}
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xl">
                    <Camera className="h-5 w-5" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) =>
                        setBusinessLogo(e.target.files?.[0] || null)
                      }
                    />
                  </label>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Business Logo
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Recommended 400x400. Max 2MB.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Business Name"
                  {...businessForm.register("name")}
                  error={businessForm.formState.errors.name?.message}
                />
                <Input
                  label="Business Slug"
                  {...businessForm.register("slug")}
                  error={businessForm.formState.errors.slug?.message}
                  hint="Visible in checkout links"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditingBusiness(false);
                    setBusinessLogo(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  loading={businessMutation.isPending}
                >
                  Save Business
                </Button>
              </div>
            </form>
          ) : (
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 rounded-xl bg-gray-900 flex items-center justify-center text-white font-bold text-xl overflow-hidden">
                {business?.image ? (
                  <img
                    src={business.image}
                    alt="Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  business?.name?.[0] || "B"
                )}
              </div>
              <div className="grid grid-cols-2 gap-x-12 gap-y-4 flex-1">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    Business Name
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    {business?.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    Public Slug
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-sm font-semibold text-gray-900">
                      {business?.slug}
                    </span>
                    <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded uppercase font-bold">
                      Live
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    Base Currency
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    NGN (Nigerian Naira)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    Default Timezone
                  </p>
                  <p className="text-sm font-semibold text-gray-900 mt-0.5">
                    Africa/Lagos
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      <EditBankDetailsCard />
    </div>
  );
};
