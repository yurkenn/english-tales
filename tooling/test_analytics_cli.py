import io
import json
import unittest
from unittest.mock import patch
import urllib.error

from analytics_cli import Analytics, AccessError, ADMIN


class AnalyticsCliTest(unittest.TestCase):
    def setUp(self):
        self.api = Analytics('private-test-token', '400061574')

    def test_existing_mode_on_later_page_does_not_create_duplicate(self):
        dimension = {'parameterName': 'mode', 'scope': 'EVENT'}
        with patch.object(self.api, 'request', side_effect=[
            {'customDimensions': [{'parameterName': 'mode', 'scope': 'USER'}],
             'nextPageToken': 'next/page'},
            {'customDimensions': [dimension]},
        ]) as request:
            self.assertFalse(self.api.ensure_mode()['created'])
            self.assertEqual(2, request.call_count)
            self.assertIn('next%2Fpage', request.call_args.args[1])
            self.assertTrue(all(len(call.args) == 2 for call in request.call_args_list))

    def test_missing_mode_creates_event_dimension_only(self):
        with patch.object(self.api, 'request', side_effect=[{}, {'name': 'created'}]) as request:
            self.assertTrue(self.api.ensure_mode()['created'])
            self.assertEqual({'parameterName': 'mode', 'displayName': 'Practice mode',
                'scope': 'EVENT', 'description': 'practice_completed: choice, card, match, spell'},
                request.call_args.args[2])

    def test_read_failure_never_falls_through_to_create(self):
        with patch.object(self.api, 'request', side_effect=AccessError('HTTP 403')) as request:
            with self.assertRaises(AccessError):
                self.api.ensure_mode()
            self.assertEqual(1, request.call_count)

    def test_realtime_is_restricted_to_configured_stream(self):
        api = Analytics('private-test-token', '123', '456')
        with patch.object(api, 'request', return_value={}) as request:
            api.inspect()
            body = request.call_args.args[2]
            self.assertEqual('456', body['dimensionFilter']['filter']['stringFilter']['value'])
            self.assertEqual('properties/123:runRealtimeReport', request.call_args.args[1])

    def test_api_error_does_not_expose_token_or_response_message(self):
        error = {'error': {'status': 'PERMISSION_DENIED', 'message': 'private-test-token',
                 'details': [{'reason': 'ACCESS_TOKEN_SCOPE_INSUFFICIENT'}]}}
        response = urllib.error.HTTPError('https://example.test', 403, 'Forbidden', {},
                                         io.BytesIO(json.dumps(error).encode()))
        with patch('urllib.request.urlopen', side_effect=response):
            with self.assertRaises(AccessError) as caught:
                self.api.request(ADMIN, self.api.property)
        self.assertIn('ACCESS_TOKEN_SCOPE_INSUFFICIENT', str(caught.exception))
        self.assertNotIn('private-test-token', str(caught.exception))

    def test_invalid_resource_id_cannot_modify_request_path(self):
        with self.assertRaises(AccessError):
            Analytics('private-test-token', '../other')


if __name__ == '__main__':
    unittest.main()
