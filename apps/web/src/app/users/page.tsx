"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import {
  AlertTriangle,
  Check,
  Circle,
  KeyRound,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  UserX,
} from "lucide-react"
import { signOut, useSession } from "next-auth/react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

import { AppShell } from "@/components/app/app-shell"
import { NotAuthorized } from "@/components/app/not-authorized"
import { PageHeader } from "@/components/app/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { generateTemporaryPassword } from "@/features/users/temporary-password"
import { TemporaryPasswordField } from "@/features/users/temporary-password-field"
import {
  useCreateUser,
  useDisableUser,
  useEnableUser,
  useResetUserPassword,
  useUpdateUser,
  useUsers,
} from "@/features/users/use-users"
import {
  UsersApiError,
  type PermissionPreset,
  type UserAccount,
  type UserPermission,
} from "@/lib/api/users"
import {
  canAccessUserManagement,
  permissionPresets,
  permissions,
} from "@/lib/permissions"

const userFormSchema = z.object({
  displayName: z.string().trim().min(1).max(120),
  email: z.email(),
  permissionPreset: z.enum(["ADMIN", "OPERATOR", "VIEWER"]).optional(),
  permissions: z.array(z.enum(permissions)).min(1),
  temporaryPassword: z.string().min(8),
  mustChangePassword: z.boolean(),
})

const editUserSchema = userFormSchema.pick({
  displayName: true,
  permissionPreset: true,
  permissions: true,
})

const resetPasswordSchema = z.object({
  newTemporaryPassword: z.string().min(8),
})

type CreateUserValues = z.output<typeof userFormSchema>
type EditUserValues = z.output<typeof editUserSchema>
type ResetPasswordValues = z.output<typeof resetPasswordSchema>

const permissionGroups = [
  {
    key: "overview",
    permissions: ["DASHBOARD_READ", "AUDIT_LOG_READ", "NETWORK_MAP_READ"],
  },
  {
    key: "users",
    permissions: [
      "USER_READ",
      "USER_CREATE",
      "USER_UPDATE",
      "USER_DISABLE",
      "USER_ENABLE",
      "USER_PASSWORD_RESET",
    ],
  },
  {
    key: "settings",
    permissions: ["SETTINGS_READ", "SETTINGS_UPDATE"],
  },
  {
    key: "servers",
    permissions: ["SERVER_READ", "SERVER_CREATE", "SERVER_UPDATE", "SERVER_DELETE"],
  },
  {
    key: "services",
    permissions: ["SERVICE_READ", "SERVICE_CREATE", "SERVICE_UPDATE", "SERVICE_DELETE"],
  },
  {
    key: "agents",
    permissions: [
      "AGENT_READ",
      "AGENT_ENROLL",
      "AGENT_CANCEL_ENROLLMENT",
      "AGENT_ROTATE_TOKEN",
      "AGENT_DECOMMISSION",
    ],
  },
] satisfies Array<{ key: string; permissions: UserPermission[] }>

function errorMessage(error: unknown) {
  if (error instanceof UsersApiError && error.details.length > 0) {
    return `${error.message}: ${error.details.join(", ")}`
  }

  return error instanceof Error ? error.message : "User operation failed"
}

function UserTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <Skeleton className="h-14 w-full" key={index} />
      ))}
    </div>
  )
}

export default function UsersPage() {
  const t = useTranslations()
  const locale = useLocale()
  const { data: session, status } = useSession()
  const mayManageUsers = canAccessUserManagement(session?.user.permissions)
  const usersQuery = useUsers(status === "authenticated" && mayManageUsers)
  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const disableMutation = useDisableUser()
  const enableMutation = useEnableUser()
  const resetPasswordMutation = useResetUserPassword()

  const [createOpen, setCreateOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null)
  const [toggleUser, setToggleUser] = useState<UserAccount | null>(null)
  const [resetUser, setResetUser] = useState<UserAccount | null>(null)

  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data])
  const enabledUserManagerCount = useMemo(
    () =>
      users.filter((user) => user.enabled && user.permissions.includes("USER_UPDATE"))
        .length,
    [users],
  )

  const createForm = useForm<CreateUserValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      displayName: "",
      email: "",
      permissionPreset: "VIEWER",
      permissions: permissionPresets.VIEWER,
      temporaryPassword: "",
      mustChangePassword: true,
    },
  })
  const editForm = useForm<EditUserValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      displayName: "",
      permissionPreset: "VIEWER",
      permissions: permissionPresets.VIEWER,
    },
  })
  const resetForm = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newTemporaryPassword: "",
    },
  })
  const createPermissions = useWatch({
    control: createForm.control,
    name: "permissions",
  })
  const createTemporaryPassword = useWatch({
    control: createForm.control,
    name: "temporaryPassword",
  })
  const editPermissions = useWatch({
    control: editForm.control,
    name: "permissions",
  })
  const resetTemporaryPassword = useWatch({
    control: resetForm.control,
    name: "newTemporaryPassword",
  })

  useEffect(() => {
    if (editingUser) {
      editForm.reset({
        displayName: editingUser.displayName,
        permissionPreset: undefined,
        permissions: editingUser.permissions,
      })
    }
  }, [editForm, editingUser])

  const loading =
    createMutation.isPending ||
    updateMutation.isPending ||
    disableMutation.isPending ||
    enableMutation.isPending ||
    resetPasswordMutation.isPending

  async function onCreate(values: CreateUserValues) {
    try {
      await createMutation.mutateAsync(values)
      toast.success(t("users.createdToast"))
      setCreateOpen(false)
      createForm.reset({
        displayName: "",
        email: "",
        permissionPreset: "VIEWER",
        permissions: permissionPresets.VIEWER,
        temporaryPassword: generateTemporaryPassword(),
        mustChangePassword: true,
      })
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function onEdit(values: EditUserValues) {
    if (!editingUser) {
      return
    }

    const isEditingSelf =
      editingUser.id === session?.user.id || editingUser.email === session?.user.email

    const permissionsChanged =
      editingUser.permissions.length !== values.permissions.length ||
      editingUser.permissions.some(
        (permission) => !values.permissions.includes(permission),
      )

    try {
      await updateMutation.mutateAsync({
        id: editingUser.id,
        input: values,
      })

      toast.success(t("users.updatedToast"))
      setEditingUser(null)

      if (isEditingSelf && permissionsChanged) {
        await signOut({
          callbackUrl: "/login",
        })
      }
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function onToggleUser() {
    if (!toggleUser) {
      return
    }

    try {
      if (toggleUser.enabled) {
        await disableMutation.mutateAsync(toggleUser.id)
        toast.success(t("users.disabledToast"))
      } else {
        await enableMutation.mutateAsync(toggleUser.id)
        toast.success(t("users.enabledToast"))
      }
      setToggleUser(null)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  async function onResetPassword(values: ResetPasswordValues) {
    if (!resetUser) {
      return
    }

    try {
      await resetPasswordMutation.mutateAsync({
        id: resetUser.id,
        input: values,
      })
      toast.success(t("users.passwordResetToast"))
      setResetUser(null)
      resetForm.reset({
        newTemporaryPassword: generateTemporaryPassword(),
      })
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  if (status !== "loading" && !mayManageUsers) {
    return (
      <AppShell>
        <NotAuthorized description={t("users.notAuthorized")} />
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <PageHeader
          badge={
            usersQuery.data ? (
              <span className="text-sm text-muted-foreground">
                {t("users.accounts", { count: users.length })}
              </span>
            ) : null
          }
          subtitle={t("users.subtitle")}
          title={t("users.title")}
          actions={
            <Button
              onClick={() => {
                createForm.reset({
                  displayName: "",
                  email: "",
                  permissionPreset: "VIEWER",
                  permissions: permissionPresets.VIEWER,
                  temporaryPassword: generateTemporaryPassword(),
                  mustChangePassword: true,
                })
                setCreateOpen(true)
              }}
            >
              <Plus className="size-4" />
              {t("users.createUser")}
            </Button>
          }
        />

        <Card>
          <CardHeader className="border-b">
            <CardTitle>{t("users.accountsTitle")}</CardTitle>
            <CardDescription>{t("users.accountsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            {usersQuery.isLoading ? <UserTableSkeleton /> : null}

            {usersQuery.isError ? (
              <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm">
                <AlertTriangle className="mt-0.5 size-4 text-destructive" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{t("users.unableToLoad")}</div>
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
                  {t("actions.retry")}
                </Button>
              </div>
            ) : null}

            {usersQuery.isSuccess && users.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center">
                <div className="font-medium">{t("users.emptyTitle")}</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {t("users.emptyDescription")}
                </div>
              </div>
            ) : null}

            {usersQuery.isSuccess && users.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("forms.displayName")}</TableHead>
                      <TableHead>{t("users.email")}</TableHead>
                      <TableHead>{t("permissions.title")}</TableHead>
                      <TableHead>{t("forms.status")}</TableHead>
                      <TableHead>{t("users.lastLogin")}</TableHead>
                      <TableHead>{t("users.created")}</TableHead>
                      <TableHead className="text-right">
                        {t("servers.actionsHeader")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => {
                      const isLastEnabledUserManager =
                        user.enabled &&
                        user.permissions.includes("USER_UPDATE") &&
                        enabledUserManagerCount <= 1

                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {user.displayName}
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {user.permissions.map((permission) => (
                                <Badge key={permission} variant="outline">
                                  {t(`permissions.items.${permission}`)}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={user.enabled ? "default" : "secondary"}>
                              {user.enabled ? t("common.enabled") : t("common.disabled")}
                            </Badge>
                            {user.mustChangePassword ? (
                              <Badge
                                className="ml-2 border-amber-500/30 text-amber-300"
                                variant="outline"
                              >
                                {t("users.passwordChangeRequired")}
                              </Badge>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            {user.lastLoginAt
                              ? new Intl.DateTimeFormat(locale, {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                }).format(new Date(user.lastLoginAt))
                              : t("common.never")}
                          </TableCell>
                          <TableCell>
                            {new Intl.DateTimeFormat(locale, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(user.createdAt))}
                          </TableCell>
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
                                  })
                                  setResetUser(user)
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
                                disabled={isLastEnabledUserManager}
                                onClick={() => setToggleUser(user)}
                                size="icon"
                                title={
                                  isLastEnabledUserManager
                                    ? t("users.lastUserManager")
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
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("users.createUser")}</DialogTitle>
            <DialogDescription>{t("users.addLocalAccount")}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={createForm.handleSubmit(onCreate)}>
            <UserFields
              disabled={loading}
              register={createForm.register}
              selectedPermissions={createPermissions}
              setPermissionPreset={(preset) => {
                createForm.setValue("permissionPreset", preset)
                createForm.setValue("permissions", permissionPresets[preset], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }}
              setPermissions={(nextPermissions) => {
                createForm.setValue("permissionPreset", undefined)
                createForm.setValue("permissions", nextPermissions, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }}
            />
            <TemporaryPasswordField
              disabled={loading}
              id="temporaryPassword"
              label={t("forms.temporaryPassword")}
              value={createTemporaryPassword}
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
                {t("users.requirePasswordChange")}
              </span>
            </label>
            <DialogFooter>
              <Button disabled={loading} type="submit">
                {t("actions.create")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editingUser)}
        onOpenChange={(open) => !open && setEditingUser(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{t("users.editUser")}</DialogTitle>
            <DialogDescription>{editingUser?.email}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={editForm.handleSubmit(onEdit)}>
            <div className="space-y-2">
              <Label htmlFor="editDisplayName">{t("forms.displayName")}</Label>
              <Input id="editDisplayName" {...editForm.register("displayName")} />
            </div>
            <PermissionField
              disabled={loading}
              selectedPermissions={editPermissions}
              setPermissionPreset={(preset) => {
                editForm.setValue("permissionPreset", preset)
                editForm.setValue("permissions", permissionPresets[preset], {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }}
              setPermissions={(nextPermissions) => {
                editForm.setValue("permissionPreset", undefined)
                editForm.setValue("permissions", nextPermissions, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }}
            />
            <DialogFooter>
              <Button disabled={loading} type="submit">
                {t("actions.save")}
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
              {toggleUser?.enabled ? t("users.disableUser") : t("users.enableUser")}
            </DialogTitle>
            <DialogDescription>{toggleUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
            {toggleUser?.enabled
              ? t("users.disabledCannotSignIn")
              : t("users.enabledCanSignIn")}
          </div>
          <DialogFooter>
            <Button
              disabled={loading}
              onClick={() => void onToggleUser()}
              variant={toggleUser?.enabled ? "destructive" : "default"}
            >
              {t("actions.confirm")}
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
            <DialogTitle>{t("users.resetPassword")}</DialogTitle>
            <DialogDescription>{resetUser?.email}</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={resetForm.handleSubmit(onResetPassword)}>
            <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
              {t("users.resetPasswordDescription")}
            </div>
            <TemporaryPasswordField
              disabled={loading}
              id="newTemporaryPassword"
              label={t("forms.newTemporaryPassword")}
              value={resetTemporaryPassword}
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
                {t("actions.reset")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  )
}

function UserFields({
  disabled,
  register,
  selectedPermissions,
  setPermissionPreset,
  setPermissions,
}: {
  disabled: boolean
  register: ReturnType<typeof useForm<CreateUserValues>>["register"]
  selectedPermissions: UserPermission[]
  setPermissionPreset: (preset: PermissionPreset) => void
  setPermissions: (permissions: UserPermission[]) => void
}) {
  const t = useTranslations()

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="displayName">{t("forms.displayName")}</Label>
        <Input id="displayName" disabled={disabled} {...register("displayName")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t("users.email")}</Label>
        <Input id="email" disabled={disabled} type="email" {...register("email")} />
      </div>
      <PermissionField
        disabled={disabled}
        selectedPermissions={selectedPermissions}
        setPermissionPreset={setPermissionPreset}
        setPermissions={setPermissions}
      />
    </>
  )
}

function PermissionField({
  disabled,
  selectedPermissions,
  setPermissionPreset,
  setPermissions,
}: {
  disabled: boolean
  selectedPermissions: UserPermission[]
  setPermissionPreset: (preset: PermissionPreset) => void
  setPermissions: (permissions: UserPermission[]) => void
}) {
  const t = useTranslations()
  const selectedSet = useMemo(
    () => new Set<UserPermission>(selectedPermissions),
    [selectedPermissions],
  )
  const selectedCount = selectedPermissions.length

  function togglePermission(permission: UserPermission) {
    const selected = new Set(selectedPermissions)
    if (selected.has(permission)) {
      selected.delete(permission)
    } else {
      selected.add(permission)
    }
    setPermissions(permissions.filter((item) => selected.has(item)))
  }

  function setGroupPermissions(groupPermissions: UserPermission[], checked: boolean) {
    const selected = new Set(selectedPermissions)
    groupPermissions.forEach((permission) => {
      if (checked) {
        selected.add(permission)
      } else {
        selected.delete(permission)
      }
    })
    setPermissions(permissions.filter((item) => selected.has(item)))
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 rounded-md border bg-muted/20 p-3 sm:grid-cols-[minmax(0,1fr)_14rem] sm:items-end">
        <div className="space-y-1">
          <Label>{t("permissions.title")}</Label>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">
              {t("permissions.selected", {
                count: selectedCount,
                total: permissions.length,
              })}
            </Badge>
            <span>{t("permissions.presetHint")}</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t("permissions.preset")}</Label>
          <Select
            disabled={disabled}
            onValueChange={(value) => setPermissionPreset(value as PermissionPreset)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("permissions.choosePreset")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ADMIN">{t("permissionPresets.ADMIN")}</SelectItem>
              <SelectItem value="OPERATOR">{t("permissionPresets.OPERATOR")}</SelectItem>
              <SelectItem value="VIEWER">{t("permissionPresets.VIEWER")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-3">
        {permissionGroups.map((group) => (
          <PermissionGroup
            disabled={disabled}
            groupKey={group.key}
            groupPermissions={group.permissions}
            key={group.key}
            selectedPermissions={selectedSet}
            setGroupPermissions={setGroupPermissions}
            togglePermission={togglePermission}
          />
        ))}
      </div>
    </div>
  )
}

function PermissionGroup({
  disabled,
  groupKey,
  groupPermissions,
  selectedPermissions,
  setGroupPermissions,
  togglePermission,
}: {
  disabled: boolean
  groupKey: string
  groupPermissions: UserPermission[]
  selectedPermissions: Set<UserPermission>
  setGroupPermissions: (permissions: UserPermission[], checked: boolean) => void
  togglePermission: (permission: UserPermission) => void
}) {
  const t = useTranslations()
  const selectedCount = groupPermissions.filter((permission) =>
    selectedPermissions.has(permission),
  ).length
  const allSelected = selectedCount === groupPermissions.length
  const noneSelected = selectedCount === 0

  return (
    <section className="rounded-md border bg-background">
      <div className="flex flex-col gap-3 border-b p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-muted-foreground" />
            <div className="font-medium">{t(`permissions.groups.${groupKey}`)}</div>
          </div>
          <div className="mt-1 text-sm text-muted-foreground">
            {t("permissions.groupSelected", {
              count: selectedCount,
              total: groupPermissions.length,
            })}
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            disabled={disabled || allSelected}
            onClick={() => setGroupPermissions(groupPermissions, true)}
            size="sm"
            type="button"
            variant="outline"
          >
            {t("permissions.selectAll")}
          </Button>
          <Button
            disabled={disabled || noneSelected}
            onClick={() => setGroupPermissions(groupPermissions, false)}
            size="sm"
            type="button"
            variant="outline"
          >
            {t("permissions.clearGroup")}
          </Button>
        </div>
      </div>
      <div className="grid gap-2 p-3 sm:grid-cols-2">
        {groupPermissions.map((permission) => {
          const checked = selectedPermissions.has(permission)

          return (
            <label
              className="flex min-h-11 items-center gap-3 rounded-md border bg-muted/10 px-3 py-2 text-sm transition-colors hover:bg-muted/30"
              key={permission}
            >
              <input
                checked={checked}
                className="size-4 accent-primary"
                disabled={disabled}
                onChange={() => togglePermission(permission)}
                type="checkbox"
              />
              <span className="flex min-w-0 flex-1 items-center gap-2">
                {checked ? (
                  <Check className="size-4 text-emerald-400" />
                ) : (
                  <Circle className="size-4 text-muted-foreground" />
                )}
                <span className="truncate">{t(`permissions.items.${permission}`)}</span>
              </span>
            </label>
          )
        })}
      </div>
    </section>
  )
}
