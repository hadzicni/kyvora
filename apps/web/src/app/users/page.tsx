"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Check,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  UserCheck,
  UserX,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { AppShell } from "@/components/app/app-shell";
import { NotAuthorized } from "@/components/app/not-authorized";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { generateTemporaryPassword } from "@/features/users/temporary-password";
import { TemporaryPasswordField } from "@/features/users/temporary-password-field";
import {
  useCreateUser,
  useDisableUser,
  useEnableUser,
  useResetUserPassword,
  useUpdateUser,
  useUsers,
} from "@/features/users/use-users";
import { UsersApiError, type UserAccount, type UserRole } from "@/lib/api/users";
import { canManageUsers } from "@/lib/permissions";

const userFormSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: z.email(),
  role: z.enum(["ADMIN", "OPERATOR", "VIEWER"]),
  temporaryPassword: z.string().min(8),
  mustChangePassword: z.boolean(),
});

const editUserSchema = userFormSchema.pick({
  displayName: true,
  role: true,
});

const resetPasswordSchema = z.object({
  newTemporaryPassword: z.string().min(8),
});

type CreateUserValues = z.output<typeof userFormSchema>;
type EditUserValues = z.output<typeof editUserSchema>;
type ResetPasswordValues = z.output<typeof resetPasswordSchema>;

function formatTimestamp(value: string | null) {
  if (!value) {
    return "Never";
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function errorMessage(error: unknown) {
  if (error instanceof UsersApiError && error.details.length > 0) {
    return `${error.message}: ${error.details.join(", ")}`;
  }

  return error instanceof Error ? error.message : "User operation failed";
}

function UserTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton className="h-14 w-full" key={index} />
      ))}
    </div>
  );
}

export default function UsersPage() {
  const { data: session, status } = useSession();
  const mayManageUsers = canManageUsers(session?.user.role);
  const usersQuery = useUsers(status === "authenticated" && mayManageUsers);
  const createMutation = useCreateUser();
  const updateMutation = useUpdateUser();
  const disableMutation = useDisableUser();
  const enableMutation = useEnableUser();
  const resetPasswordMutation = useResetUserPassword();

  const [createOpen, setCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [toggleUser, setToggleUser] = useState<UserAccount | null>(null);
  const [resetUser, setResetUser] = useState<UserAccount | null>(null);

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const enabledAdminCount = useMemo(
    () => users.filter((user) => user.enabled && user.role === "ADMIN").length,
    [users]
  );

  const createForm = useForm<CreateUserValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      displayName: "",
      email: "",
      role: "VIEWER",
      temporaryPassword: "",
      mustChangePassword: true,
    },
  });
  const editForm = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      displayName: "",
      role: "VIEWER",
    },
  });
  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newTemporaryPassword: "",
    },
  });
  const createRole = useWatch({
    control: createForm.control,
    name: "role",
  });
  const editRole = useWatch({
    control: editForm.control,
    name: "role",
  });

  useEffect(() => {
    if (editingUser) {
      editForm.reset({
        displayName: editingUser.displayName,
        role: editingUser.role,
      });
    }
  }, [editForm, editingUser]);

  const loading =
    createMutation.isPending ||
    updateMutation.isPending ||
    disableMutation.isPending ||
    enableMutation.isPending ||
    resetPasswordMutation.isPending;

  async function onCreate(values: CreateUserValues) {
    try {
      await createMutation.mutateAsync(values);
      toast.success("User created");
      setCreateOpen(false);
      createForm.reset({
        displayName: "",
        email: "",
        role: "VIEWER",
        temporaryPassword: generateTemporaryPassword(),
        mustChangePassword: true,
      });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function onEdit(values: EditUserValues) {
    if (!editingUser) {
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editingUser.id,
        input: values,
      });
      toast.success("User updated");
      setEditingUser(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function onToggleUser() {
    if (!toggleUser) {
      return;
    }

    try {
      if (toggleUser.enabled) {
        await disableMutation.mutateAsync(toggleUser.id);
        toast.success("User disabled");
      } else {
        await enableMutation.mutateAsync(toggleUser.id);
        toast.success("User enabled");
      }
      setToggleUser(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  async function onResetPassword(values: ResetPasswordValues) {
    if (!resetUser) {
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({
        id: resetUser.id,
        input: values,
      });
      toast.success("Password reset");
      setResetUser(null);
      resetForm.reset({
        newTemporaryPassword: generateTemporaryPassword(),
      });
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  if (status !== "loading" && !mayManageUsers) {
    return (
      <AppShell>
        <NotAuthorized description="User management requires an ADMIN account." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage local Kyvora accounts and access roles.
            </p>
          </div>
          <Button
            onClick={() => {
              createForm.reset({
                displayName: "",
                email: "",
                role: "VIEWER",
                temporaryPassword: generateTemporaryPassword(),
                mustChangePassword: true,
              });
              setCreateOpen(true);
            }}
          >
            <Plus className="size-4" />
            Create user
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Accounts</CardTitle>
            <CardDescription>
              Password hashes and temporary passwords are never returned.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {usersQuery.isLoading ? <UserTableSkeleton /> : null}

            {usersQuery.isError ? (
              <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm">
                <AlertTriangle className="mt-0.5 size-4 text-destructive" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">Unable to load users</div>
                  <div className="mt-1 text-muted-foreground">
                    {errorMessage(usersQuery.error)}
                  </div>
                </div>
                <Button
                  disabled={usersQuery.isFetching}
                  onClick={() => void usersQuery.refetch()}
                  size="sm"
                  variant="outline"
                >
                  <RefreshCw className="size-4" />
                  Retry
                </Button>
              </div>
            ) : null}

            {usersQuery.isSuccess && users.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center">
                <div className="font-medium">No users found</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Create the first managed account.
                </div>
              </div>
            ) : null}

            {usersQuery.isSuccess && users.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Display name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last login</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const isLastEnabledAdmin =
                        user.enabled &&
                        user.role === "ADMIN" &&
                        enabledAdminCount <= 1;

                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.displayName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{user.role}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.enabled ? "default" : "secondary"}>
                              {user.enabled ? "Enabled" : "Disabled"}
                            </Badge>
                            {user.mustChangePassword ? (
                              <Badge className="ml-2 border-amber-500/30 text-amber-300" variant="outline">
                                Password change required
                              </Badge>
                            ) : null}
                          </TableCell>
                          <TableCell>{formatTimestamp(user.lastLoginAt)}</TableCell>
                          <TableCell>{formatTimestamp(user.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex justify-end gap-2">
                              <Button
                                aria-label={`Edit ${user.email}`}
                                onClick={() => setEditingUser(user)}
                                size="icon"
                                variant="outline"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                aria-label={`Reset password for ${user.email}`}
                                onClick={() => {
                                  resetForm.reset({
                                    newTemporaryPassword: generateTemporaryPassword(),
                                  });
                                  setResetUser(user);
                                }}
                                size="icon"
                                variant="outline"
                              >
                                <KeyRound className="size-4" />
                              </Button>
                              <Button
                                aria-label={
                                  user.enabled
                                    ? `Disable ${user.email}`
                                    : `Enable ${user.email}`
                                }
                                disabled={isLastEnabledAdmin}
                                onClick={() => setToggleUser(user)}
                                size="icon"
                                title={
                                  isLastEnabledAdmin
                                    ? "Cannot disable the last enabled admin"
                                    : undefined
                                }
                                variant={user.enabled ? "destructive" : "outline"}
                              >
                                {user.enabled ? (
                                  <UserX className="size-4" />
                                ) : (
                                  <UserCheck className="size-4" />
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create user</DialogTitle>
            <DialogDescription>Add a local Kyvora account.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={createForm.handleSubmit(onCreate)}
          >
            <UserFields
              disabled={loading}
              register={createForm.register}
              role={createRole}
              setRole={(role) => createForm.setValue("role", role)}
            />
            <TemporaryPasswordField
              disabled={loading}
              id="temporaryPassword"
              label="Temporary password"
              value={createForm.watch("temporaryPassword")}
              register={createForm.register("temporaryPassword")}
              onChange={(value) =>
                createForm.setValue("temporaryPassword", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <label className="flex items-center gap-3 rounded-md border bg-muted/30 p-3 text-sm">
              <input
                className="size-4 accent-primary"
                type="checkbox"
                {...createForm.register("mustChangePassword")}
              />
              <span className="flex min-w-0 flex-1 items-center gap-2">
                <Check className="size-4 text-emerald-400" />
                Require password change on next login
              </span>
            </label>
            <DialogFooter>
              <Button disabled={loading} type="submit">
                Create
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingUser)}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>{editingUser?.email}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={editForm.handleSubmit(onEdit)}>
            <div className="space-y-2">
              <Label htmlFor="editDisplayName">Display name</Label>
              <Input id="editDisplayName" {...editForm.register("displayName")} />
            </div>
            <RoleField
              disabled={loading}
              role={editRole}
              setRole={(role) => editForm.setValue("role", role)}
            />
            <DialogFooter>
              <Button disabled={loading} type="submit">
                Save
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(toggleUser)}
        onOpenChange={(open) => !open && setToggleUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {toggleUser?.enabled ? "Disable user" : "Enable user"}
            </DialogTitle>
            <DialogDescription>{toggleUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
            {toggleUser?.enabled
              ? "Disabled users cannot sign in or refresh sessions."
              : "Enabled users can sign in with their current password."}
          </div>
          <DialogFooter>
            <Button
              disabled={loading}
              onClick={() => void onToggleUser()}
              variant={toggleUser?.enabled ? "destructive" : "default"}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(resetUser)}
        onOpenChange={(open) => !open && setResetUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>{resetUser?.email}</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={resetForm.handleSubmit(onResetPassword)}
          >
            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              User will be required to change this password on next login.
            </div>
            <TemporaryPasswordField
              disabled={loading}
              id="newTemporaryPassword"
              label="New temporary password"
              value={resetForm.watch("newTemporaryPassword")}
              register={resetForm.register("newTemporaryPassword")}
              onChange={(value) =>
                resetForm.setValue("newTemporaryPassword", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
            />
            <DialogFooter>
              <Button disabled={loading} type="submit">
                Reset
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function UserFields({
  disabled,
  register,
  role,
  setRole,
}: {
  disabled: boolean;
  register: ReturnType<typeof useForm<CreateUserValues>>["register"];
  role: UserRole;
  setRole: (role: UserRole) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="displayName">Display name</Label>
        <Input id="displayName" disabled={disabled} {...register("displayName")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" disabled={disabled} type="email" {...register("email")} />
      </div>
      <RoleField disabled={disabled} role={role} setRole={setRole} />
    </>
  );
}

function RoleField({
  disabled,
  role,
  setRole,
}: {
  disabled: boolean;
  role: UserRole;
  setRole: (role: UserRole) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>Role</Label>
      <Select
        disabled={disabled}
        onValueChange={(value) => setRole(value as UserRole)}
        value={role}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ADMIN">ADMIN</SelectItem>
          <SelectItem value="OPERATOR">OPERATOR</SelectItem>
          <SelectItem value="VIEWER">VIEWER</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
