import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Chip,
} from '@mui/material';
import { useI18n } from '../../i18n';

interface SignFormProps {
  title: string;
  activityName: string;
  otherId?: number;
  loading: boolean;
  signing: boolean;
  status: string;
  error: string;
  expectedOtherIds?: number[];
  onDetect: () => void;
  onSign: () => void;
  children?: React.ReactNode;
}

const SignForm: React.FC<SignFormProps> = ({
  title,
  activityName,
  otherId,
  loading,
  signing,
  status,
  error,
  expectedOtherIds,
  onDetect,
  onSign,
  children,
}) => {
  const { t } = useI18n();

  const isTypeMatch = expectedOtherIds
    ? otherId !== undefined && expectedOtherIds.includes(otherId)
    : true;

  return (
    <Box sx={{ maxWidth: 560, mx: 'auto' }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 300 }}>
        {title}
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Button
            variant="contained"
            onClick={onDetect}
            disabled={loading}
            fullWidth
            size="large"
            sx={{ mb: 3 }}
          >
            {loading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                {t('sign.detecting')}
              </>
            ) : (
              t('sign.detectActivity')
            )}
          </Button>

          {error && (
            <Chip
              label={t(error)}
              color={error === 'sign.noActivity' ? 'default' : 'error'}
              sx={{ mb: 2, display: 'flex' }}
            />
          )}

          {activityName && activityName !== '无签到活动' && activityName !== '需重新登录' && activityName !== '无课程' && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                {activityName}
                {otherId !== undefined && (
                  <Chip
                    label={`otherId: ${otherId}`}
                    size="small"
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                )}
              </Typography>

              {!isTypeMatch && expectedOtherIds && (
                <Chip
                  label={t('sign.typeMismatch')}
                  color="warning"
                  sx={{ mb: 1 }}
                />
              )}
            </Box>
          )}

          {/* Extra form fields (photo upload, location inputs, etc.) */}
          {children}

          {/* Status */}
          {status && (
            <Typography
              variant="body1"
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: status === t('sign.success')
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
                color: status === t('sign.success') ? 'success.main' : 'error.main',
                fontWeight: 600,
              }}
            >
              {status}
            </Typography>
          )}

          {/* Sign Button */}
          {activityName && isTypeMatch && !status && (
            <Button
              id="sign-btn"
              variant="contained"
              color="success"
              onClick={onSign}
              disabled={signing}
              fullWidth
              size="large"
              sx={{ mt: 2 }}
            >
              {signing ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1, color: 'inherit' }} />
                  {t('sign.signing')}
                </>
              ) : (
                t('sign.signIn')
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default SignForm;
